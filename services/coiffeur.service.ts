/**
 * Service pour la gestion des profils coiffeurs
 * Gere les details professionnels, disponibilites, et zones de couverture
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Profile,
  CoiffeurDetails,
  CoiffeurDetailsInsert,
  CoiffeurDetailsUpdate,
  CoiffeurAvailability,
  CoiffeurAvailabilityInsert,
  CoiffeurAvailabilityUpdate,
  CoverageZone,
  CoverageZoneInsert,
  CoverageZoneUpdate,
  CoiffeurProfile,
  CoiffeurFilters,
  HomeServiceCoiffeur,
  PaginatedResponse,
  ServiceLocationType,
} from '@/types';

const COIFFEURS_PER_PAGE = 10;

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const coiffeurService = {
  // ============================================
  // GESTION DES DETAILS DU COIFFEUR
  // ============================================

  /**
   * Creer ou mettre a jour les details d'un coiffeur
   */
  async upsertCoiffeurDetails(details: CoiffeurDetailsInsert): Promise<CoiffeurDetails> {
    const { data, error } = await supabase
      .from('coiffeur_details')
      .upsert(details, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Recuperer les details d'un coiffeur
   */
  async getCoiffeurDetails(userId: string): Promise<CoiffeurDetails | null> {
    const { data, error } = await supabase
      .from('coiffeur_details')
      .select('*')
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

  /**
   * Mettre a jour les details d'un coiffeur
   */
  async updateCoiffeurDetails(userId: string, updates: CoiffeurDetailsUpdate): Promise<CoiffeurDetails> {
    const { data, error } = await supabase
      .from('coiffeur_details')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Recuperer le profil complet d'un coiffeur
   */
  async getCoiffeurFullProfile(userId: string): Promise<CoiffeurProfile | null> {
    // Recuperer le profil de base
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('role', 'coiffeur')
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return null;
      }
      throw new Error(profileError.message);
    }

    // Recuperer les details du coiffeur
    const { data: details } = await supabase
      .from('coiffeur_details')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Recuperer les zones de couverture
    const { data: zones } = await supabase
      .from('coverage_zones')
      .select('*')
      .eq('coiffeur_id', userId)
      .eq('is_active', true);

    // Recuperer le salon
    const { data: salon } = await supabase
      .from('salons')
      .select('*')
      .eq('owner_id', userId)
      .single();

    // Recuperer les disponibilites
    const { data: availabilities } = await supabase
      .from('coiffeur_availability')
      .select('*')
      .eq('coiffeur_id', userId);

    return {
      ...profile,
      coiffeur_details: details || undefined,
      coverage_zones: zones || [],
      salon: salon || undefined,
      availabilities: availabilities || [],
    };
  },

  // ============================================
  // GESTION DES DISPONIBILITES
  // ============================================

  /**
   * Activer/desactiver la disponibilite
   */
  async setAvailability(userId: string, isAvailable: boolean): Promise<CoiffeurDetails> {
    return this.updateCoiffeurDetails(userId, { is_available: isAvailable });
  },

  /**
   * Activer/desactiver le mode vacances
   */
  async setVacationMode(
    userId: string,
    vacationMode: boolean,
    startDate?: string,
    endDate?: string
  ): Promise<CoiffeurDetails> {
    return this.updateCoiffeurDetails(userId, {
      vacation_mode: vacationMode,
      vacation_start: startDate || null,
      vacation_end: endDate || null,
    });
  },

  /**
   * Ajouter une disponibilite specifique
   */
  async addAvailability(availability: CoiffeurAvailabilityInsert): Promise<CoiffeurAvailability> {
    const { data, error } = await supabase
      .from('coiffeur_availability')
      .insert(availability)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour une disponibilite
   */
  async updateAvailability(id: string, updates: CoiffeurAvailabilityUpdate): Promise<CoiffeurAvailability> {
    const { data, error } = await supabase
      .from('coiffeur_availability')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Supprimer une disponibilite
   */
  async deleteAvailability(id: string): Promise<void> {
    const { error } = await supabase
      .from('coiffeur_availability')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer les disponibilites d'un coiffeur
   */
  async getCoiffeurAvailabilities(coiffeurId: string): Promise<CoiffeurAvailability[]> {
    const { data, error } = await supabase
      .from('coiffeur_availability')
      .select('*')
      .eq('coiffeur_id', coiffeurId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Definir les horaires hebdomadaires
   */
  async setWeeklySchedule(
    coiffeurId: string,
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      serviceLocation?: ServiceLocationType;
    }>
  ): Promise<CoiffeurAvailability[]> {
    // Supprimer les anciennes disponibilites recurrentes
    await supabase
      .from('coiffeur_availability')
      .delete()
      .eq('coiffeur_id', coiffeurId)
      .is('specific_date', null);

    // Ajouter les nouvelles
    const availabilities: CoiffeurAvailabilityInsert[] = schedule.map(slot => ({
      coiffeur_id: coiffeurId,
      day_of_week: slot.dayOfWeek,
      specific_date: null,
      start_time: slot.startTime,
      end_time: slot.endTime,
      is_available: slot.isAvailable,
      service_location: slot.serviceLocation || 'both',
    }));

    const { data, error } = await supabase
      .from('coiffeur_availability')
      .insert(availabilities)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // ============================================
  // GESTION DES ZONES DE COUVERTURE
  // ============================================

  /**
   * Ajouter une zone de couverture
   */
  async addCoverageZone(zone: CoverageZoneInsert): Promise<CoverageZone> {
    const { data, error } = await supabase
      .from('coverage_zones')
      .insert(zone)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour une zone de couverture
   */
  async updateCoverageZone(id: string, updates: CoverageZoneUpdate): Promise<CoverageZone> {
    const { data, error } = await supabase
      .from('coverage_zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Supprimer une zone de couverture
   */
  async deleteCoverageZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('coverage_zones')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer les zones de couverture d'un coiffeur
   */
  async getCoverageZones(coiffeurId: string): Promise<CoverageZone[]> {
    const { data, error } = await supabase
      .from('coverage_zones')
      .select('*')
      .eq('coiffeur_id', coiffeurId)
      .eq('is_active', true)
      .order('city', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // ============================================
  // CONFIGURATION DU SERVICE A DOMICILE
  // ============================================

  /**
   * Activer/configurer le service a domicile
   */
  async configureHomeService(
    userId: string,
    config: {
      enabled: boolean;
      fee?: number;
      minDistance?: number;
      maxDistance?: number;
    }
  ): Promise<CoiffeurDetails> {
    return this.updateCoiffeurDetails(userId, {
      offers_home_service: config.enabled,
      home_service_fee: config.fee,
      min_home_service_distance: config.minDistance,
      max_home_service_distance: config.maxDistance,
    });
  },

  /**
   * Verifier si un coiffeur couvre une zone specifique
   */
  async checkCoverage(
    coiffeurId: string,
    latitude: number,
    longitude: number
  ): Promise<{ covered: boolean; additionalFee: number }> {
    const zones = await this.getCoverageZones(coiffeurId);

    if (zones.length === 0) {
      // Pas de zone definie = couvre partout
      const details = await this.getCoiffeurDetails(coiffeurId);
      return {
        covered: details?.offers_home_service || false,
        additionalFee: details?.home_service_fee || 0,
      };
    }

    // Verifier chaque zone
    for (const zone of zones) {
      if (zone.center_latitude && zone.center_longitude) {
        const distance = this.calculateDistance(
          zone.center_latitude,
          zone.center_longitude,
          latitude,
          longitude
        );

        if (distance <= zone.radius_km) {
          return {
            covered: true,
            additionalFee: zone.additional_fee,
          };
        }
      }
    }

    return { covered: false, additionalFee: 0 };
  },

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  // ============================================
  // RECHERCHE DE COIFFEURS
  // ============================================

  /**
   * Rechercher des coiffeurs avec filtres
   */
  async searchCoiffeurs(
    filters?: CoiffeurFilters,
    page: number = 1
  ): Promise<PaginatedResponse<CoiffeurProfile>> {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        coiffeur_details(*),
        salons(*)
      `, { count: 'exact' })
      .eq('role', 'coiffeur');

    // Appliquer les filtres
    if (filters?.isAvailable !== undefined) {
      query = query.eq('coiffeur_details.is_available', filters.isAvailable);
    }
    if (filters?.offersHomeService) {
      query = query.eq('coiffeur_details.offers_home_service', true);
    }
    if (filters?.offersSalonService) {
      query = query.eq('coiffeur_details.offers_salon_service', true);
    }
    if (filters?.city) {
      query = query.ilike('salons.city', `%${filters.city}%`);
    }
    if (filters?.minRating) {
      query = query.gte('salons.rating', filters.minRating);
    }

    // Pagination
    const from = (page - 1) * COIFFEURS_PER_PAGE;
    const to = from + COIFFEURS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Transformer les donnees
    const coiffeurs: CoiffeurProfile[] = (data || []).map((item: any) => ({
      ...item,
      coiffeur_details: item.coiffeur_details?.[0] || undefined,
      salon: item.salons?.[0] || undefined,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / COIFFEURS_PER_PAGE);

    return {
      data: coiffeurs,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Trouver des coiffeurs proposant le service a domicile a proximite
   */
  async findHomeServiceCoiffeurs(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 20,
    limit: number = 20
  ): Promise<HomeServiceCoiffeur[]> {
    // Recuperer tous les coiffeurs offrant le service a domicile
    const { data, error } = await supabase
      .from('coiffeur_details')
      .select(`
        user_id,
        home_service_fee,
        max_home_service_distance,
        profiles!inner(full_name, avatar_url),
        salons!coiffeur_details_user_id_fkey(rating)
      `)
      .eq('offers_home_service', true)
      .eq('is_available', true)
      .eq('vacation_mode', false);

    if (error) {
      throw new Error(error.message);
    }

    // Recuperer les zones de couverture
    const coiffeurIds = data?.map(d => d.user_id) || [];
    const { data: zonesData } = await supabase
      .from('coverage_zones')
      .select('*')
      .in('coiffeur_id', coiffeurIds)
      .eq('is_active', true);

    // Calculer les distances et filtrer
    const results: HomeServiceCoiffeur[] = [];

    for (const coiffeur of data || []) {
      const zones = zonesData?.filter(z => z.coiffeur_id === coiffeur.user_id) || [];

      let minDistance = Infinity;
      let additionalFee = coiffeur.home_service_fee;

      if (zones.length === 0) {
        // Pas de zone definie, utiliser la distance max du coiffeur
        minDistance = 0; // Assume couvre partout
      } else {
        for (const zone of zones) {
          if (zone.center_latitude && zone.center_longitude) {
            const distance = this.calculateDistance(
              zone.center_latitude,
              zone.center_longitude,
              latitude,
              longitude
            );

            if (distance <= zone.radius_km && distance < minDistance) {
              minDistance = distance;
              additionalFee = zone.additional_fee || coiffeur.home_service_fee;
            }
          }
        }
      }

      if (minDistance <= maxDistanceKm) {
        results.push({
          coiffeur_id: coiffeur.user_id,
          full_name: (coiffeur as any).profiles?.full_name || '',
          avatar_url: (coiffeur as any).profiles?.avatar_url || null,
          distance_km: Math.round(minDistance * 100) / 100,
          home_service_fee: additionalFee,
          rating: (coiffeur as any).salons?.rating || 0,
        });
      }
    }

    // Trier par distance et limiter
    return results
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);
  },

  // ============================================
  // STATISTIQUES DU COIFFEUR
  // ============================================

  /**
   * Mettre a jour les statistiques du coiffeur
   */
  async updateStats(coiffeurId: string): Promise<void> {
    // Compter les reservations completees
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('coiffeur_id', coiffeurId)
      .eq('status', 'completed');

    // Compter les reservations annulees
    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('coiffeur_id', coiffeurId)
      .eq('status', 'cancelled');

    // Compter les clients uniques
    const { data: uniqueClients } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('coiffeur_id', coiffeurId)
      .eq('status', 'completed');

    const uniqueClientCount = new Set(uniqueClients?.map(b => b.client_id)).size;

    // Calculer le taux d'annulation
    const totalBookings = (completedBookings || 0) + (cancelledBookings || 0);
    const cancellationRate = totalBookings > 0
      ? ((cancelledBookings || 0) / totalBookings) * 100
      : 0;

    // Mettre a jour les stats
    await this.updateCoiffeurDetails(coiffeurId, {
      total_bookings_completed: completedBookings || 0,
      total_clients_served: uniqueClientCount,
      cancellation_rate: Math.round(cancellationRate * 100) / 100,
    });
  },

  /**
   * Recuperer les statistiques du coiffeur
   */
  async getCoiffeurStats(coiffeurId: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating: number;
    uniqueClients: number;
  }> {
    // Reservations par statut
    const { data: bookings } = await supabase
      .from('bookings')
      .select('status, total_price')
      .eq('coiffeur_id', coiffeurId);

    const stats = {
      totalBookings: bookings?.length || 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      uniqueClients: 0,
    };

    bookings?.forEach(booking => {
      switch (booking.status) {
        case 'completed':
          stats.completedBookings++;
          stats.totalRevenue += booking.total_price;
          break;
        case 'pending':
        case 'confirmed':
          stats.pendingBookings++;
          break;
        case 'cancelled':
          stats.cancelledBookings++;
          break;
      }
    });

    // Note moyenne du salon
    const { data: salon } = await supabase
      .from('salons')
      .select('rating')
      .eq('owner_id', coiffeurId)
      .single();

    stats.averageRating = salon?.rating || 0;

    // Clients uniques
    const { data: clients } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('coiffeur_id', coiffeurId)
      .eq('status', 'completed');

    stats.uniqueClients = new Set(clients?.map(b => b.client_id)).size;

    return stats;
  },
};
