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

      // Sécurité : Si l'Edge Function n'a pas renvoyé de paymentId, 
      // on s'assure que la ligne existe en base (Récupération ou Création)
      let paymentId = data.paymentId;
      
      if (!paymentId) {
        console.warn('DEBUG: Pas de paymentId renvoyé, tentative de récupération/création via stripe_payment_intent_id');
        
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();
        
        if (existingPayment) {
          paymentId = existingPayment.id;
        } else {
          // INSERT de secours si la ligne n'existe vraiment pas
          console.log('DEBUG: Ligne inexistante, création du paiement de secours...');
          
          // Calculs simplifiés pour le secours (l'essentiel est le lien booking_id + intent_id)
          const payAmount = Math.round(paymentType === 'full' ? amountInCents : amountInCents * DEPOSIT_RATE);
          const commission = Math.round(payAmount * AFROPLAN_COMMISSION_RATE);
          
          const { data: newPayment, error: insertError } = await supabase
            .from('payments')
            .insert({
              booking_id: bookingId,
              salon_id: salonId,
              amount: payAmount,
              total_service_price: amountInCents,
              remaining_amount: paymentType === 'full' ? 0 : amountInCents - payAmount,
              commission: commission,
              salon_amount: payAmount - commission,
              commission_rate: AFROPLAN_COMMISSION_RATE,
              status: 'pending',
              payment_type: paymentType,
              stripe_payment_intent_id: paymentIntentId,
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Erreur lors de la création du paiement de secours:', insertError);
          } else if (newPayment) {
            paymentId = newPayment.id;
            console.log('DEBUG: Paiement de secours créé avec ID:', paymentId);
          }
        }
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
   * Confirmer un paiement (appelé après validation Stripe)
   */
  async confirmPayment(paymentId?: string, stripePaymentIntentId?: string) {
    console.log('--- DEBUT confirmPayment ---', { paymentId, stripePaymentIntentId });
    
    if (!paymentId && !stripePaymentIntentId) {
      console.error('Erreur confirmPayment: Aucun identifiant fourni');
      throw new Error('Identifiant de paiement manquant pour la confirmation.');
    }

    // On prépare l'objet de mise à jour
    const updateData = {
      status: 'completed' as PaymentStatus,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;

    if (stripePaymentIntentId) {
      updateData.stripe_payment_intent_id = stripePaymentIntentId;
    }

    let query = supabase.from('payments').update(updateData);

    if (stripePaymentIntentId && stripePaymentIntentId !== '' && stripePaymentIntentId !== 'undefined') {
      console.log('DEBUG: Filtrage par stripe_payment_intent_id:', stripePaymentIntentId);
      query = query.eq('stripe_payment_intent_id', stripePaymentIntentId);
    } else if (paymentId && paymentId !== 'undefined' && paymentId !== 'null' && paymentId !== '') {
      console.log('DEBUG: Filtrage par paymentId:', paymentId);
      query = query.eq('id', paymentId);
    } else {
      throw new Error('Identifiant de filtrage (Stripe Intent ID) manquant pour la confirmation.');
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error('Erreur SQL confirmPayment:', error);
      throw new Error(`Erreur lors de la confirmation du paiement: ${error.message}`);
    }

    if (!data) {
      console.error('CRITIQUE: Paiement introuvable avec les critères fournis', { paymentId, stripePaymentIntentId });
      
      // Tentative de secours : chercher si le paiement existe déjà en mode complété
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .or(`id.eq.${paymentId},stripe_payment_intent_id.eq.${stripePaymentIntentId}`)
        .maybeSingle();
      
      if (existingPayment) {
        console.log('DEBUG: Paiement déjà existant trouvé:', existingPayment);
        if (existingPayment.status === 'completed') {
          console.log('INFO: Le paiement est déjà marqué comme complété.');
          return existingPayment;
        }
      }
      
      throw new Error('Paiement introuvable pour la confirmation.');
    }

    console.log('DEBUG: Paiement mis à jour avec succès:', data.id);

    // Mettre à jour le statut de la réservation
    if (data.booking_id) {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.booking_id);
      
      if (bookingError) {
        console.error('Erreur mise à jour réservation:', bookingError);
      } else {
        console.log('DEBUG: Réservation confirmée:', data.booking_id);
      }
    }

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
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
