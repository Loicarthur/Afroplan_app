/**
 * Service pour la gestion des reservations
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
        coiffeur:profiles(*)
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
        client:profiles(*),
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
        client:profiles(*),
        coiffeur:profiles(*)
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

    return data;
  },

  /**
   * Annuler une reservation
   */
  async cancelBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, 'cancelled');
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
    // Recuperer les horaires du salon
    const { data: salon } = await supabase
      .from('salons')
      .select('opening_hours')
      .eq('id', salonId)
      .single();

    if (!salon?.opening_hours) {
      return [];
    }

    // Recuperer les reservations existantes
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('salon_id', salonId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    // Calculer les creneaux disponibles (logique simplifiee)
    const slots: string[] = [];
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof typeof salon.opening_hours;
    const daySchedule = (salon.opening_hours as any)[dayOfWeek];

    if (!daySchedule || daySchedule.isClosed) {
      return [];
    }

    // Generer des creneaux de 30 minutes
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
        // Verifier si le creneau n'est pas pris
        const isBooked = bookings?.some(
          (b) => b.start_time < endTime && b.end_time > currentTime
        );

        if (!isBooked) {
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
