/**
 * Service de paiement Stripe pour AfroPlan
 * Gestion des paiements avec Stripe Connect et système de commission
 */

import { supabase } from '@/lib/supabase';

// Taux d'acompte à la réservation (20% du prix total)
export const DEPOSIT_RATE = 0.20;

// Commission de la plateforme sur l'acompte ou le paiement total
export const AFROPLAN_COMMISSION_RATE = 0.20;

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  paymentId?: string;
}

export const paymentService = {
  /**
   * Crée un Payment Intent via l'Edge Function Supabase
   * Cette fonction crée également la ligne 'pending' dans la table payments
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number, // en centimes
    salonId: string,
    paymentType: 'deposit' | 'full' = 'deposit'
  ): Promise<PaymentIntentResponse> {
    console.log('--- DEBUT createPaymentIntent ---', { bookingId, amount, salonId, paymentType });

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          salonId,
          amount,
          paymentType,
          currency: 'eur',
        },
      });

      if (error) {
        console.error('Erreur appel Edge Function:', error);
        throw new Error(error.message || 'Impossible de créer l\'intention de paiement');
      }

      if (!data || !data.clientSecret) {
        throw new Error('Réponse invalide de la passerelle de paiement: clientSecret manquant');
      }

      const clientSecret = data.clientSecret;
      const paymentIntentId = data.paymentIntentId || '';
      const paymentId = data.paymentId || '';
      
      console.log('DEBUG: Payment Intent créé avec succès', { paymentIntentId });

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
    return availableBalance;
  },

  /**
   * Effectuer un virement vers le compte bancaire du salon
   */
  async withdrawFunds(salonId: string) {
    const { data, error } = await supabase.functions.invoke('manage-stripe-account', {
      body: { action: 'create_payout', salonId },
    });

    if (error) {
      console.error('Erreur virement:', error);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Récupère le statut d'un paiement
   */
  async getPaymentStatus(bookingId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, payment_type')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
