/**
 * Service pour la gestion des fonctionnalites client
 * Gere les adresses, preferences et historique
 */

import { supabase } from '@/lib/supabase';
import {
  Profile,
  ProfileUpdate,
  ClientAddress,
  ClientAddressInsert,
  ClientAddressUpdate,
  Booking,
  BookingWithDetails,
  Salon,
  PaginatedResponse,
} from '@/types';

const ITEMS_PER_PAGE = 10;

export const clientService = {
  // ============================================
  // GESTION DU PROFIL CLIENT
  // ============================================

  /**
   * Recuperer le profil du client
   */
  async getClientProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('role', 'client')
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
   * Mettre a jour le profil du client
   */
  async updateClientProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // ============================================
  // GESTION DES ADRESSES
  // ============================================

  /**
   * Ajouter une nouvelle adresse
   */
  async addAddress(address: ClientAddressInsert): Promise<ClientAddress> {
    // Si c'est la premiere adresse ou si elle est definie comme par defaut
    if (address.is_default) {
      // Retirer le statut par defaut des autres adresses
      await supabase
        .from('client_addresses')
        .update({ is_default: false })
        .eq('user_id', address.user_id);
    }

    const { data, error } = await supabase
      .from('client_addresses')
      .insert(address)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour une adresse
   */
  async updateAddress(id: string, userId: string, updates: ClientAddressUpdate): Promise<ClientAddress> {
    // Si on definit comme par defaut, retirer les autres
    if (updates.is_default) {
      await supabase
        .from('client_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('client_addresses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Supprimer une adresse
   */
  async deleteAddress(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('client_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer toutes les adresses d'un client
   */
  async getAddresses(userId: string): Promise<ClientAddress[]> {
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Recuperer l'adresse par defaut d'un client
   */
  async getDefaultAddress(userId: string): Promise<ClientAddress | null> {
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas d'adresse par defaut, retourner la premiere
        const addresses = await this.getAddresses(userId);
        return addresses.length > 0 ? addresses[0] : null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Definir une adresse comme par defaut
   */
  async setDefaultAddress(id: string, userId: string): Promise<ClientAddress> {
    // Retirer le statut par defaut des autres adresses
    await supabase
      .from('client_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Definir la nouvelle adresse par defaut
    return this.updateAddress(id, userId, { is_default: true });
  },

  /**
   * Recuperer une adresse par ID
   */
  async getAddressById(id: string, userId: string): Promise<ClientAddress | null> {
    const { data, error } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  // ============================================
  // HISTORIQUE ET STATISTIQUES
  // ============================================

  /**
   * Recuperer l'historique des reservations d'un client
   */
  async getBookingHistory(
    userId: string,
    page: number = 1
  ): Promise<PaginatedResponse<BookingWithDetails>> {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('bookings')
      .select(`
        *,
        salon:salons(*),
        service:services(*),
        coiffeur:profiles(*)
      `, { count: 'exact' })
      .eq('client_id', userId)
      .order('booking_date', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les salons visites par un client
   */
  async getVisitedSalons(userId: string, limit: number = 10): Promise<Salon[]> {
    // Recuperer les salons des reservations completees, uniques
    const { data, error } = await supabase
      .from('bookings')
      .select('salon_id, salon:salons(*)')
      .eq('client_id', userId)
      .eq('status', 'completed')
      .order('booking_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Filtrer les doublons et limiter
    const uniqueSalons: Salon[] = [];
    const seenIds = new Set<string>();

    for (const booking of data || []) {
      if (booking.salon && !seenIds.has(booking.salon_id)) {
        seenIds.add(booking.salon_id);
        uniqueSalons.push(booking.salon as unknown as Salon);
        if (uniqueSalons.length >= limit) break;
      }
    }

    return uniqueSalons;
  },

  /**
   * Recuperer les statistiques du client
   */
  async getClientStats(userId: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    favoriteCategories: string[];
    visitedSalonsCount: number;
  }> {
    // Reservations
    const { data: bookings } = await supabase
      .from('bookings')
      .select('status, total_price, service:services(category)')
      .eq('client_id', userId);

    const stats = {
      totalBookings: bookings?.length || 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
      favoriteCategories: [] as string[],
      visitedSalonsCount: 0,
    };

    const categoryCount: Record<string, number> = {};

    bookings?.forEach(booking => {
      switch (booking.status) {
        case 'completed':
          stats.completedBookings++;
          stats.totalSpent += booking.total_price;
          if (booking.service?.category) {
            categoryCount[booking.service.category] = (categoryCount[booking.service.category] || 0) + 1;
          }
          break;
        case 'cancelled':
          stats.cancelledBookings++;
          break;
      }
    });

    // Trier les categories par frequence
    stats.favoriteCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Salons visites
    const { count: salonCount } = await supabase
      .from('bookings')
      .select('salon_id', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed');

    stats.visitedSalonsCount = salonCount || 0;

    return stats;
  },

  /**
   * Verifier si un client a deja visite un salon
   */
  async hasVisitedSalon(userId: string, salonId: string): Promise<boolean> {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('salon_id', salonId)
      .eq('status', 'completed');

    return (count || 0) > 0;
  },

  /**
   * Verifier si c'est la premiere reservation du client
   */
  async isFirstBooking(userId: string): Promise<boolean> {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed');

    return (count || 0) === 0;
  },

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  /**
   * Recuperer des salons recommandes pour un client
   * Base sur l'historique et les preferences
   */
  async getRecommendedSalons(userId: string, limit: number = 6): Promise<Salon[]> {
    // Recuperer les categories preferees du client
    const stats = await this.getClientStats(userId);

    if (stats.favoriteCategories.length === 0) {
      // Pas d'historique, retourner les salons populaires
      const { data } = await supabase
        .from('salons')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(limit);

      return data || [];
    }

    // Recuperer les salons dans les categories preferees
    const { data: salonCategories } = await supabase
      .from('salon_categories')
      .select('salon_id, categories!inner(slug)')
      .in('categories.slug', stats.favoriteCategories);

    if (!salonCategories || salonCategories.length === 0) {
      const { data } = await supabase
        .from('salons')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      return data || [];
    }

    const salonIds = [...new Set(salonCategories.map(sc => sc.salon_id))];

    // Exclure les salons deja visites
    const { data: visitedBookings } = await supabase
      .from('bookings')
      .select('salon_id')
      .eq('client_id', userId)
      .eq('status', 'completed');

    const visitedSalonIds = new Set(visitedBookings?.map(b => b.salon_id) || []);
    const recommendedSalonIds = salonIds.filter(id => !visitedSalonIds.has(id));

    if (recommendedSalonIds.length === 0) {
      const { data } = await supabase
        .from('salons')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      return data || [];
    }

    const { data: salons } = await supabase
      .from('salons')
      .select('*')
      .in('id', recommendedSalonIds)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    return salons || [];
  },
};
