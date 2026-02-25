import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMMISSION_RATES: Record<string, number> = {
  free: 0.20,
  starter: 0.15,
  pro: 0.12,
  premium: 0.10,
};

const DEPOSIT_RATE = 0.20;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2023-10-16' });
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // On récupère le jeton sans le valider via la gateway
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non authentifié');

    const token = authHeader.replace('Bearer ', '');
    // On demande à Supabase Admin de nous dire à qui appartient ce jeton
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) throw new Error('Session invalide');

    const { bookingId, salonId, amount, paymentType = 'deposit', currency = 'eur' } = await req.json();

    // 1. Infos Salon
    const { data: stripeAccount } = await supabaseAdmin
      .from('stripe_accounts')
      .select('stripe_account_id, subscription_plan')
      .eq('salon_id', salonId)
      .maybeSingle();

    const plan = stripeAccount?.subscription_plan || 'free';
    const commissionRate = COMMISSION_RATES[plan] || 0.20;
    const payAmount = Math.round(paymentType === 'full' ? amount : Math.round(amount * DEPOSIT_RATE));
    const applicationFee = Math.round(payAmount * commissionRate);

    console.log(`Plan: ${plan}, Commission: ${commissionRate}, Amount: ${payAmount}, Fee: ${applicationFee}`);

    // 2. Stripe Intent
    const intentParams: any = {
      amount: payAmount,
      currency,
      metadata: { 
        booking_id: bookingId, 
        salon_id: salonId, 
        user_id: user.id,
        version: '1.0.1'
      },
      automatic_payment_methods: { enabled: true },
    };

    if (stripeAccount?.stripe_account_id) {
      intentParams.application_fee_amount = applicationFee;
      intentParams.transfer_data = { destination: stripeAccount.stripe_account_id };
    }

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    // 3. Enregistrement DB
    console.log(`Enregistrement du paiement en DB pour booking ${bookingId}`);
    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: bookingId,
        salon_id: salonId,
        amount: Math.round(payAmount),
        total_service_price: Math.round(amount),
        remaining_amount: Math.round(paymentType === 'full' ? 0 : amount - payAmount),
        commission: Math.round(applicationFee),
        salon_amount: Math.round(payAmount - applicationFee),
        commission_rate: commissionRate,
        status: 'pending',
        payment_type: paymentType,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (payError) {
      console.error('Erreur insertion paiement details:', payError);
      throw new Error(`Erreur lors de l'enregistrement du paiement: ${payError.message} (Code: ${payError.code})`);
    }

    if (!payment) {
      throw new Error('Erreur: Le paiement n\'a pas pu être créé en base de données (données vides).');
    }

    console.log(`Paiement créé avec succès: ${payment.id}`);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret, 
        paymentId: payment.id,
        paymentIntentId: paymentIntent.id,
        version: '1.0.1'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
