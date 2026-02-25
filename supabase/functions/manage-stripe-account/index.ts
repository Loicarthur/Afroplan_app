import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2023-10-16' });
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non authentifié');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) throw new Error('Session invalide');

    const { action, salonId, email, iban } = await req.json();

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('owner_id, name')
      .eq('id', salonId)
      .single();

    if (!salon || salon.owner_id !== user.id) {
      throw new Error('Action non autorisée');
    }

    if (action === 'create_custom_account') {
      const account = await stripe.accounts.create({
        type: 'custom',
        country: 'FR',
        email: email || user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        settings: { payouts: { schedule: { interval: 'manual' } } }
      });

      await supabaseAdmin.from('stripe_accounts').upsert({
        salon_id: salonId,
        stripe_account_id: account.id,
        is_onboarded: false
      });

      return new Response(JSON.stringify({ stripeAccountId: account.id }), { headers: corsHeaders });
    }

    if (action === 'attach_bank_account') {
      const { data: stripeAcc } = await supabaseAdmin
        .from('stripe_accounts')
        .select('stripe_account_id')
        .eq('salon_id', salonId)
        .single();

      const externalAccount = await stripe.accounts.createExternalAccount(
        stripeAcc.stripe_account_id,
        {
          external_account: {
            object: 'bank_account',
            country: 'FR',
            currency: 'eur',
            account_number: iban,
          },
          default_for_currency: true,
        }
      );

      await supabaseAdmin.from('stripe_accounts').update({ 
        metadata: { iban_last4: externalAccount.last4, bank_name: externalAccount.bank_name },
        is_onboarded: true
      }).eq('salon_id', salonId);

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    throw new Error('Action inconnue');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
