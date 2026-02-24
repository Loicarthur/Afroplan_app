/**
 * Supabase Edge Function: create-payment-intent
 * Creates a Stripe PaymentIntent with application_fee_amount for AfroPlan commission (20%)
 *
 * Required env vars:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 *
 * Request body:
 * {
 *   bookingId: string,
 *   salonId: string,
 *   amount: number (in cents),
 *   paymentType: 'deposit' | 'full',
 *   currency: string (default 'eur')
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const COMMISSION_RATES: Record<string, number> = {
  free: 0.20,     // 20% commission standard
  starter: 0.15,  // 15% with Starter plan
  pro: 0.12,      // 12% with Pro plan
  premium: 0.10,  // 10% with Premium plan
};

const DEPOSIT_RATE = 0.20; // 20% of service price as deposit

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bookingId, salonId, amount, paymentType = 'deposit', currency = 'eur' } = await req.json();

    // Validate inputs
    if (!bookingId || !salonId) {
      return new Response(
        JSON.stringify({ error: 'bookingId and salonId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get salon's Stripe Connect account (optionnel — fallback si absent)
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, subscription_plan')
      .eq('salon_id', salonId)
      .single();

    // Commission selon le plan du salon (défaut 20 %)
    const plan = stripeAccount?.subscription_plan || 'free';
    const commissionRate = COMMISSION_RATES[plan] || 0.20;
    const depositAmount = Math.round(amount * DEPOSIT_RATE);
    const payAmount = paymentType === 'full' ? amount : depositAmount;
    const applicationFee = Math.round(payAmount * commissionRate);

    // Construction des paramètres du PaymentIntent
    // Si le salon a un compte Stripe Connect → split automatique via application_fee_amount
    // Sinon → l'argent entier arrive sur le compte plateforme AfroPlan
    const paymentIntentParams: Record<string, any> = {
      amount: payAmount,
      currency,
      metadata: {
        booking_id: bookingId,
        salon_id: salonId,
        payment_type: paymentType,
        commission_rate: commissionRate.toString(),
        platform: 'afroplan',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    if (stripeAccount?.stripe_account_id) {
      // Stripe Connect : le split commission/salon est automatique
      paymentIntentParams.application_fee_amount = applicationFee;
      paymentIntentParams.transfer_data = {
        destination: stripeAccount.stripe_account_id,
      };
    }
    // (sans Connect : AfroPlan collecte tout, redistribue manuellement ou via payout)

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Save payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        salon_id: salonId,
        client_id: user.id,
        amount: payAmount,
        total_service_price: amount,
        remaining_amount: paymentType === 'full' ? 0 : amount - depositAmount,
        commission: applicationFee,
        salon_amount: payAmount - applicationFee,
        commission_rate: commissionRate,
        currency,
        status: 'pending',
        payment_type: paymentType,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment?.id,
        amount: payAmount,
        applicationFee,
        salonAmount: payAmount - applicationFee,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
