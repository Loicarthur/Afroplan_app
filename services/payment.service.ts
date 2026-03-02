/**
 * Service de paiement Stripe pour AfroPlan
 * Gestion des paiements avec Stripe Connect et système de commission
 */

import { supabase } from '@/lib/supabase';

// Taux d'acompte à la réservation (20% du prix du service)
export const DEPOSIT_RATE = 0.20; // 20% du prix du service

// Commission fixe AfroPlan: 20% sur chaque transaction
// S'applique sur l'acompte ou le paiement intégral
export const AFROPLAN_COMMISSION_RATE = 0.20; // 20%

// Configuration des taux de commission selon le plan d'abonnement
// Les salons abonnés bénéficient de taux réduits
export const COMMISSION_RATES = {
  free: 0.20,      // 20% commission standard
  starter: 0.15,   // 15% avec abonnement Starter
  pro: 0.12,       // 12% avec abonnement Pro
  premium: 0.10,   // 10% avec abonnement Premium
} as const;

// Plans d'abonnement pour les salons
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    commission: 20,
    features: [
      'Visibilité sur la plateforme',
      'Gestion des réservations',
      'Profil salon basique',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    priceId: 'price_starter_monthly', // ID Stripe à configurer
    commission: 15,
    features: [
      'Tout du plan Gratuit',
      'Commission réduite à 15%',
      'Statistiques de base',
      'Support email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceId: 'price_pro_monthly', // ID Stripe à configurer
    commission: 12,
    features: [
      'Tout du plan Starter',
      'Commission réduite à 12%',
      'Statistiques avancées',
      'Mise en avant dans les recherches',
      'Support prioritaire',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 79,
    priceId: 'price_premium_monthly', // ID Stripe à configurer
    commission: 10,
    features: [
      'Tout du plan Pro',
      'Commission réduite à 10%',
      'Badge "Salon Premium"',
      'Promotions personnalisées',
      'Analytics détaillés',
      'Account manager dédié',
    ],
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentIntent {
  id: string;
  bookingId: string;
  depositAmount: number;      // Acompte payé par le client (20% du service)
  totalServicePrice: number;  // Prix total du service
  remainingAmount: number;    // Reste à payer au salon
  commission: number;         // Commission AfroPlan sur l'acompte
  salonDepositAmount: number; // Part de l'acompte reversée au salon
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  clientSecret?: string;
  paymentId?: string;
}

export interface StripeAccount {
  id: string;
  salonId: string;
  stripeAccountId: string | null;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing' | null;
}

export const paymentService = {
  /**
   * Calculer le montant de l'acompte (20% du prix du service)
   */
  calculateDeposit(totalServicePrice: number): number {
    return Math.round(totalServicePrice * DEPOSIT_RATE);
  },

  /**
   * Créer une intention de paiement via l'Edge Function Supabase
   */
  async createPaymentIntent(
    bookingId: string,
    amountInCents: number,
    salonId: string,
    paymentType: 'deposit' | 'full' = 'deposit'
  ): Promise<{
    clientSecret: string;
    paymentIntentId?: string;
    paymentId?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          salonId,
          amount: amountInCents,
          paymentType,
          currency: 'eur',
        },
      });

      console.error('DEBUG: RAW DATA FROM EDGE FUNCTION:', JSON.stringify(data));
      if (error) {
        console.error('DEBUG: ERROR FROM EDGE FUNCTION:', JSON.stringify(error));
      }
      
      if (data?.version) {
        console.error(`DEBUG: Version Edge Function: ${data.version}`);
      }

      if (error) {
        let errorMsg = error.message;
        if ((error as any).context) {
          const body = await (error as any).context.text();
          try {
            const json = JSON.parse(body);
            errorMsg = json.error || json.message || body;
          } catch (e) {
            errorMsg = body || error.message;
          }
        }
        throw new Error(errorMsg);
      }

      if (!data || !data.clientSecret) {
        throw new Error('Réponse invalide de la passerelle de paiement: clientSecret manquant');
      }

      const clientSecret = data.clientSecret;
      const paymentIntentId = data.paymentIntentId || data.stripe_payment_intent_id || clientSecret.split('_secret')[0];
      const paymentId = data.paymentId || '';
      
      if (!paymentId) {
        console.log('DEBUG: Pas de paymentId renvoyé par la fonction, la confirmation se fera via stripe_payment_intent_id');
      }

      return {
        clientSecret,
        paymentIntentId,
        paymentId,
      };
    } catch (err: any) {
      console.error('Erreur createPaymentIntent:', err.message);
      throw err;
    }
  },

  /**
   * Récupérer l'historique des paiements d'un salon
   */
  async getSalonPayments(
    salonId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          *,
          client:profiles!bookings_client_id_fkey(*),
          service:services(*)
        )
      `, { count: 'exact' })
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: page < Math.ceil((count || 0) / limit),
    };
  },

  /**
   * Créer un compte Stripe Connect CUSTOM pour un salon
   */
  async createStripeCustomAccount(salonId: string, email: string) {
    const { data, error } = await supabase.functions.invoke('manage-stripe-account', {
      body: { action: 'create_custom_account', salonId, email },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Enregistrer l'IBAN (RIB) pour un compte Custom
   */
  async registerIban(salonId: string, iban: string) {
    const { data, error } = await supabase.functions.invoke('manage-stripe-account', {
      body: { action: 'attach_bank_account', salonId, iban },
    });

    if (error) {
      console.error('Erreur enregistrement IBAN:', error);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Récupérer le solde disponible pour un virement (80% net)
   */
  async getSalonBalance(salonId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('salon_amount')
      .eq('salon_id', salonId)
      .eq('status', 'completed')
      .eq('is_paid_out', false);

    if (error) throw new Error(error.message);

    const availableBalance = data?.reduce((sum, p) => sum + p.salon_amount, 0) || 0;

    return {
      availableBalance,
      currency: 'eur',
    };
  },

  /**
   * Confirmer un paiement (Attend que le Webhook Stripe mette à jour la DB)
   */
  async confirmPayment(paymentId?: string, stripePaymentIntentId?: string) {
    console.log('--- ATTENTE CONFIRMATION WEBHOOK ---', { paymentId, stripePaymentIntentId });
    
    if (!paymentId && !stripePaymentIntentId) {
      throw new Error('Identifiant de paiement manquant.');
    }

    const maxRetries = 5; // On attend jusqu'à 7.5 secondes (le webhook est rapide)
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      console.log(`DEBUG: Vérification statut (tentative ${attempt}/${maxRetries})...`);

      // On cherche l'enregistrement mis à jour par le Webhook
      let query = supabase.from('payments').select('*, booking:bookings(*)');

      if (stripePaymentIntentId && stripePaymentIntentId !== '' && stripePaymentIntentId !== 'undefined') {
        query = query.eq('stripe_payment_intent_id', stripePaymentIntentId);
      } else if (paymentId && paymentId !== '') {
        query = query.eq('id', paymentId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Erreur SQL confirmPayment:', error);
        throw new Error('Erreur lors de la vérification du paiement.');
      }

      if (data) {
        if (data.status === 'completed') {
          console.log('✅ DEBUG: Webhook reçu et traité ! Paiement complété.');
          return data;
        }
        console.log(`DEBUG: Paiement trouvé mais statut = ${data.status}. On attend le Webhook...`);
      } else {
        console.log('DEBUG: Enregistrement de paiement non encore créé/trouvé...');
      }

      // Attente avant la prochaine vérification
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.error('TIMEOUT: Le Webhook Stripe met trop de temps à répondre.');
    // On renvoie quand même un succès "silencieux" si le paiement Stripe était OK (PaymentSheet n'a pas crashé)
    // Le client verra sa réservation confirmée au prochain rafraîchissement.
    return { status: 'processing' };
  },

  /**
   * Initier un remboursement
   */
  async initiateRefund(paymentId: string, reason?: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
