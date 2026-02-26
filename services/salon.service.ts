/**
 * Service pour la gestion des salons
 * Inclut les filtres avances pour service a domicile, promotions, localisation
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Salon,
  SalonInsert,
  SalonUpdate,
  SalonWithDetails,
  SalonFilters,
  SalonFiltersExtended,
  SalonWithPromotions,
  Service,
  ServiceInsert,
  ServiceUpdate,
  ServiceExtended,
  ServiceLocationType,
  Category,
  GalleryImage,
  Review,
  ReviewWithClient,
  Promotion,
  PaginatedResponse,
} from '@/types';

const SALONS_PER_PAGE = 10;

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const salonService = {
  /**
   * Recuperer tous les salons avec pagination et filtres
   */
  async getSalons(
    page: number = 1,
    filters?: SalonFilters
  ): Promise<PaginatedResponse<Salon & { min_price?: number }>> {
    checkSupabaseConfig();
    
    // On récupère les salons et leurs services actifs pour calculer le prix min
    let query = supabase
      .from('salons')
      .select('*, services(price, is_active)', { count: 'exact' })
      .eq('is_active', true);

    // Appliquer les filtres
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters?.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }
    if (filters?.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Pagination
    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;
    query = query.range(from, to);
    query = query.order('rating', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculer le prix min pour chaque salon
    const processedData = (data || []).map(salon => {
      const allServices = (salon as any).services || [];
      // On ne garde que les services vraiment actifs
      const activeServices = allServices.filter((s: any) => s.is_active);
      const prices = activeServices.map((s: any) => s.price).filter((p: any) => p != null);
      const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
      
      const { services: _, ...salonData } = salon as any;
      return { ...salonData, min_price: minPrice };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / SALONS_PER_PAGE);

    return {
      data: processedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Rechercher des salons
   */
  async searchSalons(query: string, limit: number = 10): Promise<Salon[]> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Recuperer un salon par son ID avec tous les details
   */
  async getSalonById(id: string): Promise<SalonWithDetails | null> {
    checkSupabaseConfig();
    const { data: salon, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    // Recuperer les services (silencieux si vide)
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', id)
      .eq('is_active', true)
      .order('category', { ascending: true });

    // Recuperer les categories (silencieux si vide)
    const { data: salonCategories } = await supabase
      .from('salon_categories')
      .select('category_id')
      .eq('salon_id', id);

    let categories: Category[] = [];
    if (salonCategories && salonCategories.length > 0) {
      const categoryIds = salonCategories.map((sc) => sc.category_id);
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);
      categories = cats || [];
    }

    // Recuperer la galerie (silencieux si vide)
    const { data: gallery } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('salon_id', id)
      .order('order', { ascending: true });

    // Recuperer le proprietaire (essentiel)
    const { data: owner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', salon.owner_id)
      .single();

    return {
      ...salon,
      services: services || [],
      categories: categories || [],
      gallery: gallery || [],
      owner: owner || undefined,
    };
  },

  /**
   * Recuperer les salons populaires
   */
  async getPopularSalons(limit: number = 6): Promise<Salon[]> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .order('reviews_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Recuperer les salons a proximite
   */
  async getNearbySalons(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 10
  ): Promise<Salon[]> {
    // Note: Pour une vraie geolocalisation, utiliser PostGIS dans Supabase
    // Ici, on utilise une approximation simple
    const latDelta = radiusKm / 111; // ~111km par degre de latitude
    const lonDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('is_active', true)
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lonDelta)
      .lte('longitude', longitude + lonDelta)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Recuperer les salons par categorie
   */
  async getSalonsByCategory(categorySlug: string, page: number = 1): Promise<PaginatedResponse<Salon>> {
    // D'abord, trouver la categorie
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!category) {
      return { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    }

    // Trouver les salons de cette categorie
    const { data: salonCategories } = await supabase
      .from('salon_categories')
      .select('salon_id')
      .eq('category_id', category.id);

    if (!salonCategories || salonCategories.length === 0) {
      return { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    }

    const salonIds = salonCategories.map((sc) => sc.salon_id);
    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('salons')
      .select('*', { count: 'exact' })
      .in('id', salonIds)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / SALONS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les avis d'un salon
   */
  async getSalonReviews(
    salonId: string,
    page: number = 1
  ): Promise<PaginatedResponse<ReviewWithClient>> {
    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;

    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('*, client:profiles!reviews_client_id_fkey(*)', { count: 'exact' })
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / SALONS_PER_PAGE);

    return {
      data: reviews || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les services d'un salon
   */
  async getSalonServices(salonId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Creer un nouveau salon (pour les coiffeurs)
   */
  async createSalon(salon: SalonInsert): Promise<Salon> {
    const { data, error } = await supabase
      .from('salons')
      .insert(salon)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour un salon
   */
  async updateSalon(id: string, updates: SalonUpdate): Promise<Salon> {
    const { data, error } = await supabase
      .from('salons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Recuperer toutes les categories
   */
  async getCategories(): Promise<Category[]> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // ============================================
  // FILTRES AVANCES
  // ============================================

  /**
   * Recherche avancee de salons avec tous les filtres
   */
  async searchSalonsAdvanced(
    filters: SalonFiltersExtended,
    page: number = 1
  ): Promise<PaginatedResponse<SalonWithPromotions>> {
    let query = supabase
      .from('salons')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Filtres de base
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters.isVerified) {
      query = query.eq('is_verified', true);
    }
    if (filters.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Filtre service a domicile
    if (filters.offersHomeService) {
      query = query.eq('offers_home_service', true);
    }

    // Pagination
    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;
    query = query.range(from, to);

    // Tri
    query = query.order('rating', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Enrichir avec les promotions actives si demande
    let enrichedData: SalonWithPromotions[] = data || [];
    if (filters.hasPromotion) {
      const now = new Date().toISOString();
      const salonIds = data?.map(s => s.id) || [];

      if (salonIds.length > 0) {
        const { data: promotions } = await supabase
          .from('promotions')
          .select('*')
          .in('salon_id', salonIds)
          .eq('status', 'active')
          .lte('start_date', now)
          .gte('end_date', now);

        // Filtrer les salons avec promotions actives
        const salonsWithPromotions = new Set(promotions?.map(p => p.salon_id) || []);
        enrichedData = data?.filter(s => salonsWithPromotions.has(s.id)) || [];
      }
    }

    // Filtrer par proximite si coordonnees fournies
    if (filters.nearbyLatitude && filters.nearbyLongitude && filters.nearbyRadiusKm) {
      enrichedData = enrichedData.filter(salon => {
        if (!salon.latitude || !salon.longitude) return false;
        const distance = this.calculateDistance(
          filters.nearbyLatitude!,
          filters.nearbyLongitude!,
          salon.latitude,
          salon.longitude
        );
        return distance <= filters.nearbyRadiusKm!;
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / SALONS_PER_PAGE);

    return {
      data: enrichedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les salons offrant le service a domicile
   */
  async getHomeServiceSalons(
    latitude?: number,
    longitude?: number,
    radiusKm: number = 20,
    page: number = 1
  ): Promise<PaginatedResponse<Salon>> {
    let query = supabase
      .from('salons')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('offers_home_service', true)
      .order('rating', { ascending: false });

    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    let filteredData = data || [];

    // Filtrer par proximite si coordonnees fournies
    if (latitude && longitude) {
      filteredData = filteredData.filter(salon => {
        if (!salon.latitude || !salon.longitude) return true; // Inclure si pas de coordonnees
        const distance = this.calculateDistance(latitude, longitude, salon.latitude, salon.longitude);
        return distance <= radiusKm;
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / SALONS_PER_PAGE);

    return {
      data: filteredData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les salons avec promotions actives
   */
  async getSalonsWithActivePromotions(
    city?: string,
    limit: number = 10
  ): Promise<SalonWithPromotions[]> {
    const now = new Date().toISOString();

    // Recuperer les promotions actives
    let promoQuery = supabase
      .from('promotions')
      .select('salon_id')
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now);

    const { data: activePromos } = await promoQuery;

    if (!activePromos || activePromos.length === 0) {
      return [];
    }

    const salonIds = [...new Set(activePromos.map(p => p.salon_id))];

    // Recuperer les salons
    let salonQuery = supabase
      .from('salons')
      .select('*')
      .in('id', salonIds)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (city) {
      salonQuery = salonQuery.ilike('city', `%${city}%`);
    }

    const { data: salons, error } = await salonQuery;

    if (error) {
      throw new Error(error.message);
    }

    // Enrichir avec les promotions
    const result: SalonWithPromotions[] = [];
    for (const salon of salons || []) {
      const { data: promotions } = await supabase
        .from('promotions')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now);

      result.push({
        ...salon,
        promotions: promotions || [],
        active_promotion_count: promotions?.length || 0,
      });
    }

    return result;
  },

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  // GESTION DES SERVICES (ETENDUE)
  // ============================================

  /**
   * Creer un service avec options etendues
   */
  async createService(service: ServiceInsert & {
    service_location?: ServiceLocationType;
    home_service_additional_fee?: number;
    min_booking_notice_hours?: number;
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour un service
   */
  async updateService(id: string, updates: ServiceUpdate & {
    service_location?: ServiceLocationType;
    home_service_additional_fee?: number;
    min_booking_notice_hours?: number;
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Supprimer tous les services d'un salon (utile avant une mise a jour globale)
   */
  async deleteServicesBySalonId(salonId: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('salon_id', salonId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Creer ou mettre a jour plusieurs services en une fois
   */
  async upsertServicesBatch(services: (ServiceInsert & {
    service_location?: ServiceLocationType;
    home_service_additional_fee?: number;
    min_booking_notice_hours?: number;
  })[]): Promise<Service[]> {
    if (services.length === 0) return [];

    const { data, error } = await supabase
      .from('services')
      .upsert(services, { onConflict: 'id' }) // Assurez-vous que 'id' est bien la clé primaire ou contrainte unique
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Supprimer un service
   */
  async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer les services d'un salon filtres par type de localisation
   */
  async getSalonServicesByLocation(
    salonId: string,
    locationType?: ServiceLocationType
  ): Promise<ServiceExtended[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true });

    if (locationType) {
      query = query.or(`service_location.eq.${locationType},service_location.eq.both`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // ============================================
  // GESTION DE LA GALERIE
  // ============================================

  /**
   * Ajouter une image a la galerie
   */
  async addGalleryImage(salonId: string, imageUrl: string, caption?: string): Promise<GalleryImage> {
    // Recuperer l'ordre max actuel
    const { data: existing } = await supabase
      .from('gallery_images')
      .select('order')
      .eq('salon_id', salonId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('gallery_images')
      .insert({
        salon_id: salonId,
        image_url: imageUrl,
        caption,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Supprimer une image de la galerie
   */
  async deleteGalleryImage(id: string): Promise<void> {
    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer la galerie d'un salon
   */
  async getSalonGallery(salonId: string): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('salon_id', salonId)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  // ============================================
  // GESTION DES CATEGORIES DU SALON
  // ============================================

  /**
   * Ajouter une categorie a un salon
   */
  async addSalonCategory(salonId: string, categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('salon_categories')
      .insert({ salon_id: salonId, category_id: categoryId });

    if (error && error.code !== '23505') { // Ignorer les doublons
      throw new Error(error.message);
    }
  },

  /**
   * Retirer une categorie d'un salon
   */
  async removeSalonCategory(salonId: string, categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('salon_categories')
      .delete()
      .eq('salon_id', salonId)
      .eq('category_id', categoryId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Definir les categories d'un salon (remplace toutes)
   */
  async setSalonCategories(salonId: string, categoryIds: string[]): Promise<void> {
    // Supprimer les anciennes categories
    await supabase
      .from('salon_categories')
      .delete()
      .eq('salon_id', salonId);

    // Ajouter les nouvelles
    if (categoryIds.length > 0) {
      const { error } = await supabase
        .from('salon_categories')
        .insert(categoryIds.map(categoryId => ({ salon_id: salonId, category_id: categoryId })));

      if (error) {
        throw new Error(error.message);
      }
    }
  },

  /**
   * Recuperer les categories d'un salon
   */
  async getSalonCategories(salonId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('salon_categories')
      .select('category_id')
      .eq('salon_id', salonId);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const categoryIds = data.map(sc => sc.category_id);
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds);

    return categories || [];
  },

  // ============================================
  // CONFIGURATION SERVICE A DOMICILE
  // ============================================

  /**
   * Activer/configurer le service a domicile pour un salon
   */
  async configureHomeService(
    salonId: string,
    config: {
      enabled: boolean;
      description?: string;
      minAmount?: number;
    }
  ): Promise<Salon> {
    return this.updateSalon(salonId, {
      offers_home_service: config.enabled,
      home_service_description: config.description,
      min_home_service_amount: config.minAmount,
    } as SalonUpdate);
  },

  // ============================================
  // STATISTIQUES DU SALON
  // ============================================

  async getSalonStats(salonId: string): Promise<{
    totalBookings: number;
    completedBookings: number;
    confirmedBookings: number;
    totalSuccessfulBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    weeklyRevenue: number;
    weeklyBookingsCount: number;
    averageRating: number;
    totalReviews: number;
    totalServices: number;
    activePromotions: number;
  }> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toLocaleDateString('en-CA');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toLocaleDateString('en-CA');

    // 1. Reservations stats (Global + Hebdo)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('status, total_price, booking_date')
      .eq('salon_id', salonId);

    const stats = {
      totalBookings: bookings?.length || 0,
      completedBookings: 0,
      confirmedBookings: 0,
      totalSuccessfulBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      weeklyRevenue: 0,
      weeklyBookingsCount: 0,
      averageRating: 0,
      totalReviews: 0,
      totalServices: 0,
      activePromotions: 0,
    };

    bookings?.forEach(booking => {
      switch (booking.status) {
        case 'completed':
          stats.completedBookings++;
          stats.totalSuccessfulBookings++;
          break;
        case 'confirmed':
          stats.confirmedBookings++;
          stats.totalSuccessfulBookings++;
          break;
        case 'pending':
          stats.pendingBookings++;
          break;
        case 'cancelled':
          stats.cancelledBookings++;
          break;
      }

      const bDate = typeof booking.booking_date === 'string' 
        ? booking.booking_date 
        : new Date(booking.booking_date).toLocaleDateString('en-CA');

      const isConfirmedOrDone = booking.status === 'confirmed' || booking.status === 'completed';
      const isThisWeek = bDate >= mondayStr && bDate <= sundayStr;
      
      if (isConfirmedOrDone && isThisWeek) {
        stats.weeklyBookingsCount++;
      }
    });

    // 2. Revenu Affiché (100% du montant payé par les clients)
    // On affiche le volume total généré pour valoriser le travail du coiffeur
    const { data: allPayments } = await supabase
      .from('payments')
      .select(`
        amount, 
        paid_at,
        booking:bookings!inner(status)
      `)
      .eq('salon_id', salonId)
      .eq('status', 'completed')
      .in('bookings.status', ['confirmed', 'completed']);

    if (allPayments) {
      allPayments.forEach((p: any) => {
        const amountEur = p.amount / 100; // On utilise 'amount' (100%) au lieu de 'salon_amount'
        stats.totalRevenue += amountEur;

        if (p.paid_at && p.paid_at >= monday.toISOString()) {
          stats.weeklyRevenue += amountEur;
        }
      });
    }

    // 3. Avis et note
    const { data: salon } = await supabase
      .from('salons')
      .select('rating, reviews_count')
      .eq('id', salonId)
      .single();

    stats.averageRating = salon?.rating || 0;
    stats.totalReviews = salon?.reviews_count || 0;

    // 4. Services
    const { count: servicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .eq('is_active', true);

    stats.totalServices = servicesCount || 0;

    // 5. Promotions actives
    const { count: promosCount } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
      .eq('status', 'active')
      .lte('start_date', now.toISOString())
      .gte('end_date', now.toISOString());

    stats.activePromotions = promosCount || 0;

    return stats;
  },

  /**
   * Recuperer le salon d'un coiffeur par son ID utilisateur
   */
  async getSalonByOwnerId(ownerId: string): Promise<Salon | null> {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },
};
