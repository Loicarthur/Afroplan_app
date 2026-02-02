/**
 * Service pour la gestion des salons
 */

import { supabase } from '@/lib/supabase';
import {
  Salon,
  SalonInsert,
  SalonUpdate,
  SalonWithDetails,
  SalonFilters,
  Service,
  Category,
  GalleryImage,
  Review,
  ReviewWithClient,
  PaginatedResponse,
} from '@/types';

const SALONS_PER_PAGE = 10;

export const salonService = {
  /**
   * Recuperer tous les salons avec pagination et filtres
   */
  async getSalons(
    page: number = 1,
    filters?: SalonFilters
  ): Promise<PaginatedResponse<Salon>> {
    let query = supabase
      .from('salons')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('rating', { ascending: false });

    // Appliquer les filtres
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters?.isVerified) {
      query = query.eq('is_verified', true);
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

    const { data, error, count } = await query;

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
   * Rechercher des salons
   */
  async searchSalons(query: string, limit: number = 10): Promise<Salon[]> {
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

    // Recuperer les services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('salon_id', id)
      .eq('is_active', true)
      .order('category', { ascending: true });

    // Recuperer les categories
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

    // Recuperer la galerie
    const { data: gallery } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('salon_id', id)
      .order('order', { ascending: true });

    // Recuperer le proprietaire
    const { data: owner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', salon.owner_id)
      .single();

    return {
      ...salon,
      services: services || [],
      categories,
      gallery: gallery || [],
      owner: owner || undefined,
    };
  },

  /**
   * Recuperer les salons populaires
   */
  async getPopularSalons(limit: number = 6): Promise<Salon[]> {
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
      .select('*, client:profiles(*)', { count: 'exact' })
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
};
