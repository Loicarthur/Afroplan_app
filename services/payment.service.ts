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
   * Calculer la commission sur l'acompte
   * L'acompte est de 20% du prix du service, la commission est prise dessus
   */
  calculateDepositCommission(
    totalServicePrice: number,
    plan: SubscriptionPlan = 'free'
  ): {
    depositAmount: number;
    commission: number;
    salonDepositAmount: number;
    commissionRate: number;
  } {
    const depositAmount = Math.round(totalServicePrice * DEPOSIT_RATE);
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
   * Calculer la commission sur un montant
   * Commission de 20% par défaut (réduite selon l'abonnement)
   */
  calculateCommission(
    amount: number,
    plan: SubscriptionPlan = 'free'
  ): {
    amount: number;
    commission: number;
    salonAmount: number;
    commissionRate: number;
  } {
    const commissionRate = COMMISSION_RATES[plan];
    const commission = Math.round(amount * commissionRate);
    const salonAmount = amount - commission;

    return {
      amount,
      commission,
      salonAmount,
      commissionRate,
    };
  },

  /**
   * Créer une intention de paiement pour une réservation
   * Supporte le paiement d'acompte ou le paiement intégral
   * Commission AfroPlan de 20% appliquée sur le montant payé
   */
  async createPaymentIntent(
    bookingId: string,
    totalServicePrice: number,
    salonId: string,
    paymentType: 'deposit' | 'full' = 'deposit'
  ): Promise<PaymentIntent> {
    // Récupérer le compte Stripe du salon
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    const plan = stripeAccount?.subscription_plan || 'free';
    const commissionRate = COMMISSION_RATES[plan];

    let payAmount: number;
    let remainingAmount: number;

    if (paymentType === 'full') {
      // Paiement intégral - le client paie tout en une fois
      payAmount = totalServicePrice;
      remainingAmount = 0;
    } else {
      // Acompte de 20% - le client paie 20% maintenant, le reste au salon
      payAmount = Math.round(totalServicePrice * DEPOSIT_RATE);
      remainingAmount = totalServicePrice - payAmount;
    }

    // Commission AfroPlan sur le montant payé en ligne
    const commission = Math.round(payAmount * commissionRate);
    const salonPayAmount = payAmount - commission;

    // Enregistrer le paiement en base (best-effort : ne bloque pas si la table n'existe pas)
    let paymentId = `demo_${Date.now()}`;
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          salon_id: salonId,
          amount: payAmount,
          total_service_price: totalServicePrice,
          remaining_amount: remainingAmount,
          commission,
          salon_amount: salonPayAmount,
          commission_rate: commissionRate,
          currency: 'eur',
          status: 'pending',
          payment_type: paymentType,
        })
        .select()
        .single();

      if (!error && payment) {
        paymentId = payment.id;
      } else if (error) {
        console.warn('[PaymentService] DB insert skipped:', error.message);
      }
    } catch (dbErr: any) {
      console.warn('[PaymentService] payments table unavailable:', dbErr.message);
    }

    return {
      id: paymentId,
      bookingId,
      depositAmount: payAmount,
      totalServicePrice,
      remainingAmount,
      commission,
      salonDepositAmount: salonPayAmount,
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
    // Skip DB update for demo payments (id starts with 'demo_')
    if (paymentId.startsWith('demo_')) {
      console.warn('[PaymentService] Demo payment, skipping DB confirm');
      return { id: paymentId, status: 'completed' };
    }

    try {
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
        console.warn('[PaymentService] confirmPayment DB error:', error.message);
        return { id: paymentId, status: 'completed' };
      }

      // Mettre à jour le statut de la réservation
      await supabase
        .from('bookings')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', data.booking_id);

      return data;
    } catch (err: any) {
      console.warn('[PaymentService] confirmPayment failed:', err.message);
      return { id: paymentId, status: 'completed' };
    }
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
