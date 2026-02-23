/**
 * Service pour la gestion des promotions
 * Permet aux salons de creer et gerer leurs promotions
 * et aux clients de les utiliser lors des reservations
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Promotion,
  PromotionInsert,
  PromotionUpdate,
  PromotionUsage,
  PromotionUsageInsert,
  PromotionWithSalon,
  ActivePromotion,
  PromotionFilters,
  DiscountCalculation,
  PaginatedResponse,
} from '@/types';

const PROMOTIONS_PER_PAGE = 10;

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const promotionService = {
  // ============================================
  // GESTION DES PROMOTIONS (POUR LES SALONS)
  // ============================================

  /**
   * Creer une nouvelle promotion
   */
  async createPromotion(promotion: PromotionInsert): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .insert(promotion)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour une promotion
   */
  async updatePromotion(id: string, updates: PromotionUpdate): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
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
   * Supprimer une promotion
   */
  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer une promotion par son ID
   */
  async getPromotionById(id: string): Promise<PromotionWithSalon | null> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, salon:salons(*)')
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
   * Recuperer les promotions d'un salon
   */
  async getSalonPromotions(
    salonId: string,
    filters?: PromotionFilters,
    page: number = 1
  ): Promise<PaginatedResponse<Promotion>> {
    let query = supabase
      .from('promotions')
      .select('*', { count: 'exact' })
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now);
    }

    // Pagination
    const from = (page - 1) * PROMOTIONS_PER_PAGE;
    const to = from + PROMOTIONS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / PROMOTIONS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Activer une promotion
   */
  async activatePromotion(id: string): Promise<Promotion> {
    return this.updatePromotion(id, { status: 'active' });
  },

  /**
   * Mettre en pause une promotion
   */
  async pausePromotion(id: string): Promise<Promotion> {
    return this.updatePromotion(id, { status: 'paused' });
  },

  /**
   * Marquer une promotion comme expiree
   */
  async expirePromotion(id: string): Promise<Promotion> {
    return this.updatePromotion(id, { status: 'expired' });
  },

  // ============================================
  // DECOUVERTE DES PROMOTIONS (POUR LES CLIENTS)
  // ============================================

  /**
   * Recuperer toutes les promotions actives
   */
  async getActivePromotions(
    city?: string,
    page: number = 1
  ): Promise<PaginatedResponse<ActivePromotion>> {
    const now = new Date().toISOString();

    let query = supabase
      .from('promotions')
      .select(`
        *,
        salon:salons(name, image_url, city, rating)
      `, { count: 'exact' })
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });

    // Filtre par ville si specifie
    if (city) {
      query = query.eq('salons.city', city);
    }

    // Pagination
    const from = (page - 1) * PROMOTIONS_PER_PAGE;
    const to = from + PROMOTIONS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Transformer les donnees pour correspondre au type ActivePromotion
    const promotions: ActivePromotion[] = (data || []).map((item: any) => ({
      ...item,
      salon_name: item.salon?.name || '',
      salon_image: item.salon?.image_url || null,
      salon_city: item.salon?.city || '',
      salon_rating: item.salon?.rating || 0,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / PROMOTIONS_PER_PAGE);

    return {
      data: promotions,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les promotions a la une (featured)
   */
  async getFeaturedPromotions(limit: number = 5): Promise<ActivePromotion[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        salon:salons(name, image_url, city, rating)
      `)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('value', { ascending: false }) // Les plus grosses promos en premier
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((item: any) => ({
      ...item,
      salon_name: item.salon?.name || '',
      salon_image: item.salon?.image_url || null,
      salon_city: item.salon?.city || '',
      salon_rating: item.salon?.rating || 0,
    }));
  },

  /**
   * Rechercher une promotion par code
   */
  async getPromotionByCode(code: string): Promise<PromotionWithSalon | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .select('*, salon:salons(*)')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
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
  // VALIDATION ET APPLICATION DES PROMOTIONS
  // ============================================

  /**
   * Verifier si une promotion est valide pour un utilisateur
   */
  async validatePromotion(
    promotionId: string,
    userId: string,
    serviceId?: string,
    amount: number = 0
  ): Promise<{ isValid: boolean; message: string }> {
    const promotion = await this.getPromotionById(promotionId);

    if (!promotion) {
      return { isValid: false, message: 'Promotion introuvable' };
    }

    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    // Verifier le statut
    if (promotion.status !== 'active') {
      return { isValid: false, message: 'Cette promotion n\'est plus active' };
    }

    // Verifier les dates
    if (now < startDate) {
      return { isValid: false, message: 'Cette promotion n\'a pas encore commence' };
    }
    if (now > endDate) {
      return { isValid: false, message: 'Cette promotion a expire' };
    }

    // Verifier le montant minimum
    if (amount < promotion.min_purchase_amount) {
      return {
        isValid: false,
        message: `Montant minimum requis: ${promotion.min_purchase_amount}EUR`,
      };
    }

    // Verifier les utilisations totales
    if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
      return { isValid: false, message: 'Cette promotion a atteint son nombre maximum d\'utilisations' };
    }

    // Verifier les utilisations par utilisateur
    const { count: userUsageCount } = await supabase
      .from('promotion_usages')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', promotionId)
      .eq('user_id', userId);

    if (promotion.max_uses_per_user && (userUsageCount || 0) >= promotion.max_uses_per_user) {
      return { isValid: false, message: 'Vous avez deja utilise cette promotion' };
    }

    // Verifier si c'est pour les nouveaux clients uniquement
    if (promotion.new_clients_only) {
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', userId)
        .eq('salon_id', promotion.salon_id)
        .eq('status', 'completed');

      if ((bookingCount || 0) > 0) {
        return { isValid: false, message: 'Cette promotion est reservee aux nouveaux clients' };
      }
    }

    // Verifier si c'est pour la premiere reservation uniquement
    if (promotion.first_booking_only) {
      const { count: anyBookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', userId)
        .eq('status', 'completed');

      if ((anyBookingCount || 0) > 0) {
        return { isValid: false, message: 'Cette promotion est reservee a votre premiere reservation' };
      }
    }

    // Verifier le jour de la semaine
    if (promotion.valid_days && promotion.valid_days.length > 0) {
      const currentDay = now.getDay();
      if (!promotion.valid_days.includes(currentDay)) {
        return { isValid: false, message: 'Cette promotion n\'est pas valide aujourd\'hui' };
      }
    }

    // Verifier le service si specifie
    if (serviceId && promotion.applicable_service_ids && promotion.applicable_service_ids.length > 0) {
      if (!promotion.applicable_service_ids.includes(serviceId)) {
        return { isValid: false, message: 'Cette promotion ne s\'applique pas a ce service' };
      }
    }

    return { isValid: true, message: 'Promotion valide' };
  },

  /**
   * Calculer la reduction d'une promotion
   */
  async calculateDiscount(
    promotionId: string,
    amount: number
  ): Promise<DiscountCalculation> {
    const promotion = await this.getPromotionById(promotionId);

    if (!promotion) {
      return {
        original_amount: amount,
        discount_amount: 0,
        final_amount: amount,
        promotion_applied: null,
      };
    }

    let discount = 0;

    switch (promotion.type) {
      case 'percentage':
        discount = amount * (promotion.value / 100);
        break;
      case 'fixed_amount':
        discount = promotion.value;
        break;
      case 'free_service':
        discount = amount;
        break;
    }

    // Appliquer le plafond si defini
    if (promotion.max_discount_amount && discount > promotion.max_discount_amount) {
      discount = promotion.max_discount_amount;
    }

    // Ne pas depasser le montant total
    if (discount > amount) {
      discount = amount;
    }

    return {
      original_amount: amount,
      discount_amount: discount,
      final_amount: amount - discount,
      promotion_applied: promotion,
    };
  },

  /**
   * Appliquer une promotion (enregistrer l'utilisation)
   */
  async applyPromotion(
    promotionId: string,
    userId: string,
    bookingId: string,
    discountApplied: number
  ): Promise<PromotionUsage> {
    const usage: PromotionUsageInsert = {
      promotion_id: promotionId,
      user_id: userId,
      booking_id: bookingId,
      discount_applied: discountApplied,
    };

    const { data, error } = await supabase
      .from('promotion_usages')
      .insert(usage)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // ============================================
  // STATISTIQUES DES PROMOTIONS
  // ============================================

  /**
   * Recuperer les statistiques d'une promotion
   */
  async getPromotionStats(promotionId: string): Promise<{
    totalUses: number;
    totalDiscountGiven: number;
    uniqueUsers: number;
  }> {
    const { data, error } = await supabase
      .from('promotion_usages')
      .select('discount_applied, user_id')
      .eq('promotion_id', promotionId);

    if (error) {
      throw new Error(error.message);
    }

    const totalUses = data?.length || 0;
    const totalDiscountGiven = data?.reduce((sum, usage) => sum + usage.discount_applied, 0) || 0;
    const uniqueUsers = new Set(data?.map(usage => usage.user_id)).size;

    return {
      totalUses,
      totalDiscountGiven,
      uniqueUsers,
    };
  },

  /**
   * Recuperer l'historique d'utilisation des promotions d'un salon
   */
  async getSalonPromotionUsages(
    salonId: string,
    page: number = 1
  ): Promise<PaginatedResponse<PromotionUsage & { promotion: Promotion; user: any }>> {
    const from = (page - 1) * PROMOTIONS_PER_PAGE;
    const to = from + PROMOTIONS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('promotion_usages')
      .select(`
        *,
        promotion:promotions!promotion_usages_promotion_id_fkey!inner(*),
        user:profiles!promotion_usages_user_id_fkey(full_name, email)
      `, { count: 'exact' })
      .eq('promotions.salon_id', salonId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / PROMOTIONS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Recuperer les promotions utilisees par un client
   */
  async getUserPromotionHistory(
    userId: string,
    page: number = 1
  ): Promise<PaginatedResponse<PromotionUsage & { promotion: PromotionWithSalon }>> {
    const from = (page - 1) * PROMOTIONS_PER_PAGE;
    const to = from + PROMOTIONS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('promotion_usages')
      .select(`
        *,
        promotion:promotions!promotion_usages_promotion_id_fkey(*, salon:salons(*))
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / PROMOTIONS_PER_PAGE);

    return {
      data: data || [],
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },
};
