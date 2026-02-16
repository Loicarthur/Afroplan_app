/**
 * Supabase Edge Function: stripe-webhook
 * Handles Stripe webhook events for AfroPlan
 *
 * Required env vars:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret (whsec_...)
 *
 * Webhook URL to configure in Stripe Dashboard:
 * https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
 *
 * Events to listen for:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 * - account.updated (for Connect onboarding)
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      // ==========================================
      // PAYMENT INTENT SUCCEEDED
      // Client's payment went through successfully
      // ==========================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.booking_id;
        const salonId = paymentIntent.metadata.salon_id;

        console.log(`Payment succeeded for booking ${bookingId}, salon ${salonId}`);

        // Update payment status in database
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        }

        // Update booking status to confirmed
        if (bookingId) {
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

          if (bookingError) {
            console.error('Error updating booking:', bookingError);
          }
        }

        break;
      }

      // ==========================================
      // PAYMENT INTENT FAILED
      // Client's payment was declined
      // ==========================================
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(`Payment failed for PI ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`);

        // Update payment status
        const { error } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating failed payment:', error);
        }

        break;
      }

      // ==========================================
      // CHARGE REFUNDED
      // A charge was refunded (full or partial)
      // ==========================================
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        console.log(`Charge refunded for PI ${paymentIntentId}`);

        const { error } = await supabase
          .from('payments')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        if (error) {
          console.error('Error updating refunded payment:', error);
        }

        // Also update booking status
        const { data: payment } = await supabase
          .from('payments')
          .select('booking_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (payment?.booking_id) {
          await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.booking_id);
        }

        break;
      }

      // ==========================================
      // ACCOUNT UPDATED (Stripe Connect)
      // Salon's Connect account was updated
      // ==========================================
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        console.log(`Connect account updated: ${account.id}`);

        const { error } = await supabase
          .from('stripe_accounts')
          .update({
            is_onboarded: account.details_submitted || false,
            charges_enabled: account.charges_enabled || false,
            payouts_enabled: account.payouts_enabled || false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', account.id);

        if (error) {
          console.error('Error updating stripe account:', error);
        }

        break;
      }

      // ==========================================
      // SUBSCRIPTION EVENTS
      // Salon subscription plan changes
      // ==========================================
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription ${event.type} for customer ${customerId}`);

        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price.id;
        let plan = 'free';
        if (priceId?.includes('starter')) plan = 'starter';
        else if (priceId?.includes('premium')) plan = 'premium';
        else if (priceId?.includes('pro')) plan = 'pro';

        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' : 'cancelled';

        const { error } = await supabase
          .from('stripe_accounts')
          .update({
            subscription_plan: plan,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating subscription:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription deleted for customer ${customerId}`);

        const { error } = await supabase
          .from('stripe_accounts')
          .update({
            subscription_plan: 'free',
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating cancelled subscription:', error);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
