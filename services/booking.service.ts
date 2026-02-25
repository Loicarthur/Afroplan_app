/**
 * Service pour la gestion des reservations
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notificationService } from './notification.service';
import {
  Booking,
  BookingInsert,
  BookingUpdate,
  BookingWithDetails,
  PaginatedResponse,
} from '@/types';

const BOOKINGS_PER_PAGE = 10;

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const bookingService = {
  /**
   * Creer une nouvelle reservation
   */
  async createBooking(booking: BookingInsert): Promise<Booking> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Recuperer les reservations d'un client
   */
  async getClientBookings(
    clientId: string,
    status?: Booking['status'],
    page: number = 1
  ): Promise<PaginatedResponse<BookingWithDetails>> {
    checkSupabaseConfig();
    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        salon:salons(*),
        service:services(*),
        coiffeur:profiles!bookings_coiffeur_id_fkey(*)
      `,
        { count: 'exact' }
      )
      .eq('client_id', clientId)
      .order('booking_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * BOOKINGS_PER_PAGE;
    const to = from + BOOKINGS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / BOOKINGS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les reservations d'un salon (pour les coiffeurs)
   */
  async getSalonBookings(
    salonId: string,
    status?: Booking['status'],
    date?: string,
    page: number = 1
  ): Promise<PaginatedResponse<BookingWithDetails>> {
    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        client:profiles!bookings_client_id_fkey(*),
        service:services(*)
      `,
        { count: 'exact' }
      )
      .eq('salon_id', salonId)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('booking_date', date);
    }

    const from = (page - 1) * BOOKINGS_PER_PAGE;
    const to = from + BOOKINGS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / BOOKINGS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer une reservation par son ID
   */
  async getBookingById(id: string): Promise<BookingWithDetails | null> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        salon:salons(*),
        service:services(*),
        client:profiles!bookings_client_id_fkey(*),
        coiffeur:profiles!bookings_coiffeur_id_fkey(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour le statut d'une reservation
   */
  async updateBookingStatus(
    id: string,
    status: Booking['status']
  ): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Notifier le client du changement de statut
    if (data) {
      if (status === 'confirmed') {
        await notificationService.createNotification({
          user_id: data.client_id,
          title: 'Rendez-vous confirmé !',
          message: `Votre coiffeur a validé votre rendez-vous du ${data.booking_date}.`,
          type: 'booking_confirmed',
          booking_id: data.id,
        });
      } else if (status === 'completed') {
        await notificationService.createNotification({
          user_id: data.client_id,
          title: 'Prestation terminée',
          message: `Merci de votre visite ! N'hésitez pas à laisser un avis.`,
          type: 'system',
          booking_id: data.id,
        });
      }
    }

    return data;
  },

  /**
   * Annuler une reservation par le coiffeur avec un motif
   */
  async cancelBookingByCoiffeur(id: string, reason: string): Promise<Booking> {
    checkSupabaseConfig();
    
    // 1. Mettre à jour le statut du rendez-vous
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        notes: `Annulation coiffeur : ${reason}`,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // 2. Notifier le client
    if (data) {
      await notificationService.createNotification({
        user_id: data.client_id,
        title: 'Rendez-vous annulé',
        message: `Votre coiffeur a annulé le RDV du ${data.booking_date}. Motif : ${reason}`,
        type: 'booking_cancelled',
        booking_id: data.id,
      });
    }

    // 3. Simuler le remboursement automatique via Stripe
    console.log(`[STRIPE] Remboursement initié pour le booking ${id} (Motif: ${reason})`);
    
    // TODO: Appel API Stripe pour le remboursement réel
    // stripe.refunds.create({ payment_intent: data.stripe_payment_intent_id });

    return data;
  },

  /**
   * Annuler une reservation (Suppression physique)
   */
  async cancelBooking(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .select(); // Important pour vérifier si la suppression a eu lieu

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('Suppression impossible : Vous n\'avez pas les droits ou le rendez-vous n\'existe plus.');
    }
  },

  /**
   * Confirmer une reservation
   */
  async confirmBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'confirmed');
  },

  /**
   * Marquer une reservation comme terminee
   */
  async completeBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'completed');
  },

  /**
   * Verifier la disponibilite d'un creneau
   */
  async checkAvailability(
    salonId: string,
    date: string,
    startTime: string,
    endTime: string,
    coiffeurId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('salon_id', salonId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed'])
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (coiffeurId) {
      query = query.eq('coiffeur_id', coiffeurId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return !data || data.length === 0;
  },

  /**
   * Recuperer les creneaux disponibles pour une date
   */
  async getAvailableSlots(
    salonId: string,
    date: string,
    serviceDurationMinutes: number
  ): Promise<string[]> {
    // 1. Recuperer les informations du salon et du propriétaire (coiffeur)
    const { data: salon } = await supabase
      .from('salons')
      .select('opening_hours, owner_id')
      .eq('id', salonId)
      .single();

    if (!salon?.opening_hours) {
      return [];
    }

    // 2. Vérifier si le coiffeur a bloqué sa journée ou a des indisponibilités spécifiques
    const { data: specificAvailabilities } = await supabase
      .from('coiffeur_availability')
      .select('*')
      .eq('coiffeur_id', salon.owner_id)
      .eq('specific_date', date);

    // Si le coiffeur a bloqué toute la journée (00:00 à 23:59 et is_available = false)
    const isDayBlocked = specificAvailabilities?.some(
      a => !a.is_available && a.start_time <= '00:00' && a.end_time >= '23:59'
    );

    if (isDayBlocked) {
      return [];
    }

    // 3. Recuperer les reservations existantes
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('salon_id', salonId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    // 4. Calculer les creneaux disponibles
    const slots: string[] = [];
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof salon.opening_hours;
    const daySchedule = (salon.opening_hours as any)[dayOfWeek];

    if (!daySchedule || daySchedule.isClosed || daySchedule.closed) {
      return [];
    }

    const openTime = daySchedule.open;
    const closeTime = daySchedule.close;

    let currentTime = openTime;
    while (currentTime < closeTime) {
      const [hours, minutes] = currentTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + serviceDurationMinutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      if (endTime <= closeTime) {
        // Vérifier si le créneau est bloqué par une indisponibilité spécifique
        const isSlotUnavailable = specificAvailabilities?.some(
          a => !a.is_available && (
            (currentTime >= a.start_time && currentTime < a.end_time) ||
            (endTime > a.start_time && endTime <= a.end_time) ||
            (currentTime <= a.start_time && endTime >= a.end_time)
          )
        );

        // Verifier si le creneau n'est pas pris par une réservation
        const isBooked = bookings?.some(
          (b) => b.start_time < endTime && b.end_time > currentTime
        );

        if (!isSlotUnavailable && !isBooked) {
          slots.push(currentTime);
        }
      }

      // Passer au creneau suivant (30 min)
      const nextMinutes = hours * 60 + minutes + 30;
      const nextHours = Math.floor(nextMinutes / 60);
      const nextMins = nextMinutes % 60;
      currentTime = `${String(nextHours).padStart(2, '0')}:${String(nextMins).padStart(2, '0')}`;
    }

    return slots;
  },

  /**
   * Recuperer les reservations a venir d'un client
   */
  async getUpcomingBookings(clientId: string, limit: number = 5): Promise<BookingWithDetails[]> {
    checkSupabaseConfig();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        salon:salons(*),
        service:services(*)
      `
      )
      .eq('client_id', clientId)
      .gte('booking_date', today)
      .in('status', ['pending', 'confirmed'])
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },
};
