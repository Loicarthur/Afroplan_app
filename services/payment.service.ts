/**
 * Service de paiement Stripe pour AfroPlan
 * Gestion des paiements avec Stripe Connect et système de commission
 */

import { supabase } from '@/lib/supabase';

// Acompte fixe à la réservation (en centimes)
export const BOOKING_DEPOSIT = 1000; // 10€ d'acompte

// Configuration des taux de commission selon le plan d'abonnement
// La commission est prise sur l'acompte de 10€
export const COMMISSION_RATES = {
  free: 0.15,      // 15% = 1.50€ sur l'acompte de 10€
  starter: 0.10,   // 10% = 1€ sur l'acompte de 10€
  pro: 0.08,       // 8% = 0.80€ sur l'acompte de 10€
  premium: 0.05,   // 5% = 0.50€ sur l'acompte de 10€
} as const;

// Plans d'abonnement pour les salons
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    commission: 15,
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
    commission: 10,
    features: [
      'Tout du plan Gratuit',
      'Commission réduite à 10%',
      'Statistiques de base',
      'Support email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceId: 'price_pro_monthly', // ID Stripe à configurer
    commission: 8,
    features: [
      'Tout du plan Starter',
      'Commission réduite à 8%',
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
    commission: 5,
    features: [
      'Tout du plan Pro',
      'Commission réduite à 5%',
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
  depositAmount: number;      // Acompte payé par le client (10€)
  totalServicePrice: number;  // Prix total du service
  remainingAmount: number;    // Reste à payer au salon
  commission: number;         // Commission AfroPlan sur l'acompte
  salonDepositAmount: number; // Part de l'acompte reversée au salon
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  clientSecret?: string;
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
   * Calculer la commission sur l'acompte
   * L'acompte est toujours de 10€, la commission est prise dessus
   */
  calculateDepositCommission(
    plan: SubscriptionPlan = 'free'
  ): {
    depositAmount: number;
    commission: number;
    salonDepositAmount: number;
    commissionRate: number;
  } {
    const depositAmount = BOOKING_DEPOSIT; // 10€ = 1000 centimes
    const commissionRate = COMMISSION_RATES[plan];
    const commission = Math.round(depositAmount * commissionRate);
    const salonDepositAmount = depositAmount - commission;

    return {
      depositAmount,
      commission,
      salonDepositAmount,
      commissionRate,
    };
  },

  /**
   * Créer une intention de paiement pour l'acompte d'une réservation
   * Le client paie 10€ d'acompte, le reste sera payé au salon directement
   */
  async createPaymentIntent(
    bookingId: string,
    totalServicePrice: number,
    salonId: string
  ): Promise<PaymentIntent> {
    // Récupérer le compte Stripe du salon
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    const plan = stripeAccount?.subscription_plan || 'free';
    const { depositAmount, commission, salonDepositAmount, commissionRate } =
      this.calculateDepositCommission(plan);

    // Calculer le reste à payer au salon
    const remainingAmount = totalServicePrice - depositAmount;

    // Enregistrer le paiement en base
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        salon_id: salonId,
        amount: depositAmount,           // Acompte de 10€
        total_service_price: totalServicePrice,
        remaining_amount: remainingAmount,
        commission,
        salon_amount: salonDepositAmount,
        commission_rate: commissionRate,
        currency: 'eur',
        status: 'pending',
        payment_type: 'deposit',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création paiement: ${error.message}`);
    }

    // Note: L'appel à l'API Stripe serait fait via une Edge Function Supabase
    // pour sécuriser les clés API. Ici on retourne les infos pour le frontend.
    return {
      id: payment.id,
      bookingId,
      depositAmount,
      totalServicePrice,
      remainingAmount,
      commission,
      salonDepositAmount,
      currency: 'eur',
      status: 'pending',
    };
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
   * Récupérer les statistiques de paiement d'un salon
   */
  async getSalonPaymentStats(salonId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    const { data, error } = await supabase
      .from('payments')
      .select('amount, commission, salon_amount, status, created_at')
      .eq('salon_id', salonId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    const stats = {
      totalRevenue: 0,
      totalCommission: 0,
      netRevenue: 0,
      transactionCount: 0,
      averageTransaction: 0,
    };

    if (data && data.length > 0) {
      stats.totalRevenue = data.reduce((sum, p) => sum + p.amount, 0);
      stats.totalCommission = data.reduce((sum, p) => sum + p.commission, 0);
      stats.netRevenue = data.reduce((sum, p) => sum + p.salon_amount, 0);
      stats.transactionCount = data.length;
      stats.averageTransaction = Math.round(stats.totalRevenue / data.length);
    }

    return stats;
  },

  /**
   * Récupérer le compte Stripe d'un salon
   */
  async getStripeAccount(salonId: string): Promise<StripeAccount | null> {
    const { data, error } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      salonId: data.salon_id,
      stripeAccountId: data.stripe_account_id,
      isOnboarded: data.is_onboarded,
      chargesEnabled: data.charges_enabled,
      payoutsEnabled: data.payouts_enabled,
      subscriptionPlan: data.subscription_plan,
      subscriptionStatus: data.subscription_status,
    };
  },

  /**
   * Créer un compte Stripe Connect pour un salon
   * Note: Cette fonction devrait appeler une Edge Function Supabase
   */
  async createStripeConnectAccount(salonId: string, email: string) {
    // Créer l'entrée en base
    const { data, error } = await supabase
      .from('stripe_accounts')
      .insert({
        salon_id: salonId,
        subscription_plan: 'free',
        is_onboarded: false,
        charges_enabled: false,
        payouts_enabled: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Note: L'appel Stripe serait fait via Edge Function
    // Retourner l'URL d'onboarding Stripe Connect
    return {
      accountId: data.id,
      onboardingUrl: null, // Serait retourné par l'Edge Function
    };
  },

  /**
   * Mettre à jour le plan d'abonnement d'un salon
   */
  async updateSubscriptionPlan(salonId: string, plan: SubscriptionPlan) {
    const { data, error } = await supabase
      .from('stripe_accounts')
      .update({
        subscription_plan: plan,
        subscription_status: plan === 'free' ? null : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('salon_id', salonId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Récupérer le solde disponible pour un salon
   */
  async getSalonBalance(salonId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('salon_amount')
      .eq('salon_id', salonId)
      .eq('status', 'completed')
      .eq('is_paid_out', false);

    if (error) {
      throw new Error(error.message);
    }

    const availableBalance = data?.reduce((sum, p) => sum + p.salon_amount, 0) || 0;

    return {
      availableBalance,
      currency: 'eur',
    };
  },

  /**
   * Confirmer un paiement (appelé après validation Stripe)
   */
  async confirmPayment(paymentId: string, stripePaymentIntentId: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        stripe_payment_intent_id: stripePaymentIntentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Mettre à jour le statut de la réservation
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.booking_id);

    return data;
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
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
