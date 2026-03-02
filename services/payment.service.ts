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
      console.error('Données reçues invalides:', data);
      throw new Error('Réponse de paiement invalide');
    }

    console.log('DEBUG: Payment Intent créé avec succès', { 
      paymentIntentId: data.paymentIntentId 
    });

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  },

  /**
   * Annule un paiement (si la réservation est annulée avant paiement effectif)
   */
  async cancelPayment(stripePaymentIntentId: string) {
    // Cette partie est généralement gérée côté backend ou via expiration Stripe
    // Mais on peut marquer le paiement comme annulé en DB
    const { error } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', stripePaymentIntentId);

    if (error) console.error('Erreur lors de l\'annulation du paiement en DB:', error);
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
