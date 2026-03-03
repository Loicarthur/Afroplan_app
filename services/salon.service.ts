/**
 * Service pour la gestion des salons
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
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const SALONS_PER_PAGE = 10;

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase non configure.');
  }
};

/**
 * Helper interne pour verifier si une liste d'indisponibilites bloque la journee
 */
const checkIsBlocked = (availabilities: any[]): boolean => {
  if (!availabilities || availabilities.length === 0) return false;
  const todayStr = new Date().toLocaleDateString('en-CA');
  return availabilities.some((a: any) => 
    a.specific_date === todayStr &&
    !a.is_available && 
    (a.start_time <= '00:00' || a.start_time === '00:00:00') && 
    (a.end_time >= '23:59' || a.end_time === '23:59:00' || a.end_time >= '23:59:59')
  );
};

export const salonService = {
  /**
   * Recuperer tous les salons avec pagination et filtres
   */
  async getSalons(page: number = 1, filters?: SalonFilters): Promise<PaginatedResponse<Salon & { min_price?: number }>> {
    checkSupabaseConfig();
    
    const selectStr = filters?.serviceName 
      ? `*, services!inner(id, name, price, is_active)` 
      : `*, services(id, name, price, is_active)`;

    let query = supabase.from('salons').select(selectStr, { count: 'exact' }).eq('is_active', true);

    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters?.minRating) query = query.gte('rating', filters.minRating);
    if (filters?.isVerified !== undefined) query = query.eq('is_verified', filters.isVerified);
    if (filters?.searchQuery) {
      // Recherche globale : Nom OR Description OR Ville
      query = query.or(`name.ilike."%${filters.searchQuery}%",description.ilike."%${filters.searchQuery}%",city.ilike."%${filters.searchQuery}%"`);
    }
    
    if (filters?.serviceName) {
      query = query.ilike('services.name', `%${filters.serviceName}%`);
    }
    
    if (filters?.category) {
      query = query.or(`specialties.ilike."%${filters.category}%",specialties.cs.{"${filters.category}"}`);
    }

    const from = (page - 1) * SALONS_PER_PAGE;
    const to = from + SALONS_PER_PAGE - 1;
    const { data, error, count } = await query.range(from, to).order('rating', { ascending: false });

    if (error) return { data: [], total: 0, page, totalPages: 0, hasMore: false };

    const ownerIds = (data || []).map(s => s.owner_id);
    const salonIds = (data || []).map(s => s.id);
    const todayStr = new Date().toLocaleDateString('en-CA');

    // 1. Vérifier les blocages manuels (indisponibilités)
    const { data: blocked } = await supabase.from('coiffeur_availability')
      .select('coiffeur_id')
      .in('coiffeur_id', ownerIds)
      .eq('specific_date', todayStr)
      .eq('is_available', false)
      .lte('start_time', '00:00:00')
      .gte('end_time', '23:59:00');
    
    const blockedSet = new Set(blocked?.map(b => b.coiffeur_id) || []);

    // 2. Vérifier les réservations entre 12h et 14h pour le badge "Libre"
    const { data: afternoonBookings } = await supabase.from('bookings')
      .select('salon_id, start_time')
      .in('salon_id', salonIds)
      .eq('booking_date', todayStr)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', '12:00')
      .lte('start_time', '14:00');

    const busyAfternoonSet = new Set(afternoonBookings?.map(b => b.salon_id) || []);

    const processedData = (data || []).map(salon => {
      const activeServices = (salon.services || []).filter((s: any) => s.is_active);
      
      let specificPrice: number | undefined;
      let specificImage: any;
      let isCustomImage = false;

      if (filters?.serviceName) {
        const matchingService = activeServices.find((s: any) => 
          s.name.toLowerCase().includes(filters.serviceName!.toLowerCase())
        );
        if (matchingService) {
          specificPrice = matchingService.price;
          if (matchingService.image_url) {
            specificImage = matchingService.image_url;
            isCustomImage = true;
          } else {
            const catalogStyle = HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).find(s => s.name === matchingService.name);
            specificImage = catalogStyle?.image;
          }
        }
      }

      const prices = activeServices.map((s: any) => s.price);
      const minPrice = specificPrice || (prices.length > 0 ? Math.min(...prices) : 25);

      return { 
        ...salon, 
        min_price: minPrice,
        service_image: specificImage,
        is_custom_service_image: isCustomImage,
        is_today_blocked: blockedSet.has(salon.owner_id),
        is_afternoon_busy: busyAfternoonSet.has(salon.id) // Nouveau flag
      };
    });

    return { 
      data: processedData, 
      total: count || 0, 
      page, 
      totalPages: Math.ceil((count || 0) / SALONS_PER_PAGE), 
      hasMore: (page * SALONS_PER_PAGE) < (count || 0) 
    };
  },

  async searchSalons(query: string, limit: number = 10): Promise<Salon[]> {
    const { data, error } = await supabase.from('salons').select('*').eq('is_active', true).or(`name.ilike."%${query}%",description.ilike."%${query}%",city.ilike."%${query}%"`).order('rating', { ascending: false }).limit(limit);
    if (error) return [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    const ownerIds = (data || []).map(s => s.owner_id);
    const { data: blocked } = await supabase.from('coiffeur_availability').select('coiffeur_id').in('coiffeur_id', ownerIds).eq('specific_date', todayStr).eq('is_available', false).lte('start_time', '00:00:00').gte('end_time', '23:59:00');
    const blockedSet = new Set(blocked?.map(b => b.coiffeur_id) || []);
    return (data || []).map(s => ({ ...s, is_today_blocked: blockedSet.has(s.owner_id) }));
  },

  async getSalonById(id: string): Promise<SalonWithDetails | null> {
    const { data: salon, error } = await supabase.from('salons').select('*').eq('id', id).single();
    if (error || !salon) return null;

    const [services, gallery, owner, availability] = await Promise.all([
      supabase.from('services').select('*').eq('salon_id', id).eq('is_active', true).order('category', { ascending: true }),
      supabase.from('gallery_images').select('*').eq('salon_id', id).order('order', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', salon.owner_id).single(),
      supabase.from('coiffeur_availability').select('*').eq('coiffeur_id', salon.owner_id).eq('specific_date', new Date().toLocaleDateString('en-CA'))
    ]);

    return {
      ...salon,
      is_today_blocked: checkIsBlocked(availability.data || []),
      services: services.data || [],
      gallery: gallery.data || [],
      owner: owner.data || undefined,
    };
  },

  async getPopularSalons(limit: number = 6): Promise<Salon[]> {
    const { data, error } = await supabase.from('salons').select('*').eq('is_active', true).eq('is_verified', true).order('rating', { ascending: false }).limit(limit);
    if (error) return [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    const ownerIds = (data || []).map(s => s.owner_id);
    const { data: blocked } = await supabase.from('coiffeur_availability').select('coiffeur_id').in('coiffeur_id', ownerIds).eq('specific_date', todayStr).eq('is_available', false).lte('start_time', '00:00:00').gte('end_time', '23:59:00');
    const blockedSet = new Set(blocked?.map(b => b.coiffeur_id) || []);
    return (data || []).map(s => ({ ...s, is_today_blocked: blockedSet.has(s.owner_id) }));
  },

  async getSalonStats(salonId: string) {
    const stats = { totalBookings: 0, completedBookings: 0, confirmedBookings: 0, totalSuccessfulBookings: 0, pendingBookings: 0, cancelledBookings: 0, totalRevenue: 0, weeklyRevenue: 0, weeklyBookingsCount: 0, averageRating: 0, totalReviews: 0, totalServices: 0, activePromotions: 0 };
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const mondayISO = monday.toISOString();

      const { data: bookings } = await supabase.from('bookings').select('status, total_price, booking_date, created_at').eq('salon_id', salonId);
      bookings?.forEach(b => {
        const isSuccessful = b.status === 'completed' || b.status === 'confirmed';
        if (isSuccessful) stats.totalSuccessfulBookings++;
        
        if (b.status === 'completed') stats.completedBookings++;
        else if (b.status === 'pending') stats.pendingBookings++;
        else if (b.status === 'cancelled') stats.cancelledBookings++;
        else if (b.status === 'confirmed') stats.confirmedBookings++;

        const bookingAmount = Number(b.total_price || 0);
        if (isSuccessful) {
          stats.totalRevenue += bookingAmount;
          
          // Cumul Hebdomadaire (depuis Lundi)
          if (b.created_at >= mondayISO) {
            stats.weeklyRevenue += bookingAmount;
            stats.weeklyBookingsCount++;
          }
        }
      });
      const { data: s } = await supabase.from('salons').select('rating, reviews_count').eq('id', salonId).single();
      if (s) { stats.averageRating = s.rating || 0; stats.totalReviews = s.reviews_count || 0; }
    } catch (e) {}
    return stats;
  },

  async getSalonByOwnerId(ownerId: string, email?: string): Promise<Salon | null> {
    let { data, error } = await supabase.from('salons').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
    if ((!data || data.length === 0) && email) {
      const emailRes = await supabase.from('salons').select('*').eq('email', email).order('created_at', { ascending: false });
      if (emailRes.data && emailRes.data.length > 0) data = emailRes.data;
    }
    return (data && data.length > 0) ? data[0] : null;
  },

  async getSalonServices(salonId: string): Promise<Service[]> {
    const { data, error } = await supabase.from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('category', { ascending: true });
    return data || [];
  },

  async createSalon(salon: SalonInsert): Promise<Salon> {
    const { data, error } = await supabase.from('salons').insert(salon).select().single();
    if (error) throw error;
    return data;
  },

  async updateSalon(id: string, updates: SalonUpdate): Promise<Salon> {
    const { data, error } = await supabase.from('salons').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // RESTORED METHODS
  async deleteServicesBySalonId(salonId: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('salon_id', salonId);
    if (error) throw error;
  },

  async upsertServicesBatch(services: any[]): Promise<Service[]> {
    if (services.length === 0) return [];
    const { data, error } = await supabase.from('services').upsert(services, { onConflict: 'id' }).select();
    if (error) throw error;
    return data || [];
  },

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  async getSalonServicesByLocation(salonId: string, locationType?: ServiceLocationType): Promise<ServiceExtended[]> {
    let query = supabase.from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('category', { ascending: true }).order('price', { ascending: true });
    if (locationType) {
      query = query.or(`service_location.eq.${locationType},service_location.eq.both`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addGalleryImage(salonId: string, imageUrl: string, caption?: string): Promise<GalleryImage> {
    const { data: existing } = await supabase.from('gallery_images').select('order').eq('salon_id', salonId).order('order', { ascending: false }).limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;
    const { data, error } = await supabase.from('gallery_images').insert({ salon_id: salonId, image_url: imageUrl, caption, order: nextOrder }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteGalleryImage(id: string): Promise<void> {
    const { error } = await supabase.from('gallery_images').delete().eq('id', id);
    if (error) throw error;
  },

  async getSalonGallery(salonId: string): Promise<GalleryImage[]> {
    const { data, error } = await supabase.from('gallery_images').select('*').eq('salon_id', salonId).order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addSalonCategory(salonId: string, categoryId: string): Promise<void> {
    const { error } = await supabase.from('salon_categories').insert({ salon_id: salonId, category_id: categoryId });
    if (error && error.code !== '23505') throw error;
  },

  async removeSalonCategory(salonId: string, categoryId: string): Promise<void> {
    const { error } = await supabase.from('salon_categories').delete().eq('salon_id', salonId).eq('category_id', categoryId);
    if (error) throw error;
  },

  async setSalonCategories(salonId: string, categoryIds: string[]): Promise<void> {
    await supabase.from('salon_categories').delete().eq('salon_id', salonId);
    if (categoryIds.length > 0) {
      const { error } = await supabase.from('salon_categories').insert(categoryIds.map(categoryId => ({ salon_id: salonId, category_id: categoryId })));
      if (error) throw error;
    }
  },

  async getSalonCategories(salonId: string): Promise<Category[]> {
    const { data, error } = await supabase.from('salon_categories').select('category_id').eq('salon_id', salonId);
    if (error) throw error;
    if (!data || data.length === 0) return [];
    const categoryIds = data.map(sc => sc.category_id);
    const { data: categories } = await supabase.from('categories').select('*').in('id', categoryIds);
    return categories || [];
  },

  async configureHomeService(salonId: string, config: { enabled: boolean; description?: string; minAmount?: number; }): Promise<Salon> {
    return this.updateSalon(salonId, { offers_home_service: config.enabled, home_service_description: config.description, min_home_service_amount: config.minAmount, } as SalonUpdate);
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getNearbySalons(latitude: number, longitude: number, radiusKm: number = 10, limit: number = 10): Promise<Salon[]> {
    const latDelta = radiusKm / 111; const lonDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));
    const { data, error } = await supabase.from('salons').select('*').eq('is_active', true).gte('latitude', latitude - latDelta).lte('latitude', latitude + latDelta).gte('longitude', longitude - lonDelta).lte('longitude', longitude + lonDelta).limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getSalonsByCategory(categorySlug: string, page: number = 1): Promise<PaginatedResponse<Salon>> {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
    if (!cat) return { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    const { data: sc } = await supabase.from('salon_categories').select('salon_id').eq('category_id', cat.id);
    if (!sc || sc.length === 0) return { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    const { data, count, error } = await supabase.from('salons').select('*', { count: 'exact' }).in('id', sc.map(x => x.salon_id)).eq('is_active', true).range((page-1)*10, page*10-1).order('rating', { ascending: false });
    if (error) return { data: [], total: 0, page, totalPages: 0, hasMore: false };
    return { data: data || [], total: count || 0, page, totalPages: Math.ceil((count||0)/10), hasMore: page*10 < (count||0) };
  },

  async getSalonReviews(salonId: string, page: number = 1): Promise<PaginatedResponse<ReviewWithClient>> {
    const { data, error, count } = await supabase.from('reviews').select('*, client:profiles!reviews_client_id_fkey(*)', { count: 'exact' }).eq('salon_id', salonId).order('created_at', { ascending: false }).range((page-1)*10, page*10-1);
    if (error) throw error;
    return { data: data || [], total: count || 0, page, totalPages: Math.ceil((count||0)/10), hasMore: page*10 < (count||0) };
  },

  async searchSalonsAdvanced(filters: SalonFiltersExtended, page: number = 1): Promise<PaginatedResponse<SalonWithPromotions>> {
    let query = supabase.from('salons').select('*', { count: 'exact' }).eq('is_active', true);
    if (filters.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters.minRating) query = query.gte('rating', filters.minRating);
    if (filters.isVerified) query = query.eq('is_verified', true);
    if (filters.searchQuery) query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    if (filters.offersHomeService) query = query.eq('offers_home_service', true);
    const from = (page - 1) * 10; const to = from + 10 - 1;
    const { data, error, count } = await query.range(from, to).order('rating', { ascending: false });
    if (error) throw error;
    return { data: data || [], total: count || 0, page, totalPages: Math.ceil((count||0)/10), hasMore: page*10 < (count||0) };
  },

  async getHomeServiceSalons(latitude?: number, longitude?: number, radiusKm: number = 20, page: number = 1): Promise<PaginatedResponse<Salon>> {
    let query = supabase.from('salons').select('*', { count: 'exact' }).eq('is_active', true).eq('offers_home_service', true).order('rating', { ascending: false });
    const { data, error, count } = await query.range((page-1)*10, page*10-1);
    if (error) throw error;
    return { data: data || [], total: count || 0, page, totalPages: Math.ceil((count||0)/10), hasMore: page*10 < (count||0) };
  },

  async getSalonsWithActivePromotions(city?: string, limit: number = 10): Promise<SalonWithPromotions[]> {
    const now = new Date().toISOString();
    const { data: promos } = await supabase.from('promotions').select('salon_id').eq('status', 'active').lte('start_date', now).gte('end_date', now);
    if (!promos || promos.length === 0) return [];
    const ids = [...new Set(promos.map(p => p.salon_id))];
    let q = supabase.from('salons').select('*').in('id', ids).eq('is_active', true).order('rating', { ascending: false }).limit(limit);
    if (city) q = q.ilike('city', `%${city}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(s => ({ ...s, active_promotion_count: 1 })); // simplified
  }
};
