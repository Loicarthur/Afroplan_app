/**
 * Service pour la gestion des avis
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Review, ReviewInsert, ReviewWithClient } from '@/types';

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const reviewService = {
  /**
   * Creer un nouvel avis
   */
  async createReview(review: ReviewInsert): Promise<Review> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Mettre a jour la note moyenne du salon
    await this.updateSalonRating(review.salon_id);

    return data;
  },

  /**
   * Mettre a jour un avis
   */
  async updateReview(
    id: string,
    updates: { rating?: number; comment?: string }
  ): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Mettre a jour la note moyenne du salon
    await this.updateSalonRating(data.salon_id);

    return data;
  },

  /**
   * Supprimer un avis
   */
  async deleteReview(id: string): Promise<void> {
    // Recuperer le salon_id avant de supprimer
    const { data: review } = await supabase
      .from('reviews')
      .select('salon_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    // Mettre a jour la note moyenne du salon
    if (review) {
      await this.updateSalonRating(review.salon_id);
    }
  },

  /**
   * Recuperer les avis d'un client
   */
  async getClientReviews(clientId: string): Promise<ReviewWithClient[]> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        salon:salons(*)
      `
      )
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Verifier si un client a deja laisse un avis pour un salon
   */
  async hasClientReviewed(clientId: string, salonId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('salon_id', salonId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  },

  /**
   * Mettre a jour la note moyenne d'un salon
   */
  async updateSalonRating(salonId: string): Promise<void> {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('salon_id', salonId);

    if (error) {
      throw new Error(error.message);
    }

    if (!reviews || reviews.length === 0) {
      await supabase
        .from('salons')
        .update({ rating: 0, reviews_count: 0 })
        .eq('id', salonId);
      return;
    }

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('salons')
      .update({
        rating: Math.round(averageRating * 10) / 10,
        reviews_count: reviews.length,
      })
      .eq('id', salonId);
  },
};
