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
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
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
