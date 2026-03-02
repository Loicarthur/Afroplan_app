/**
 * Service pour la gestion des favoris
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Favorite, Salon } from '@/types';

const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export const favoriteService = {
  /**
   * Ajouter un salon aux favoris
   */
  async addFavorite(userId: string, salonId: string): Promise<Favorite> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, salon_id: salonId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Retirer un salon des favoris
   */
  async removeFavorite(userId: string, salonId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('salon_id', salonId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Verifier si un salon est en favori
   */
  async isFavorite(userId: string, salonId: string): Promise<boolean> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('salon_id', salonId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  },

  /**
   * Recuperer tous les favoris d'un utilisateur
   */
  async getUserFavorites(userId: string): Promise<Salon[]> {
    checkSupabaseConfig();
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('salon_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    if (!favorites || favorites.length === 0) {
      return [];
    }

    const salonIds = favorites.map((f) => f.salon_id);

    const { data: salons, error: salonsError } = await supabase
      .from('salons')
      .select('*')
      .in('id', salonIds)
      .eq('is_active', true);

    if (salonsError) {
      throw new Error(salonsError.message);
    }

    return salons || [];
  },

  /**
   * Toggle favori (ajouter ou retirer)
   */
  async toggleFavorite(userId: string, salonId: string): Promise<boolean> {
    const isFav = await this.isFavorite(userId, salonId);

    if (isFav) {
      await this.removeFavorite(userId, salonId);
      return false;
    } else {
      await this.addFavorite(userId, salonId);
      return true;
    }
  },
};

export const favoriteStyleService = {
  /**
   * Ajouter un style aux favoris
   */
  async addFavoriteStyle(userId: string, styleId: string): Promise<FavoriteStyle> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('favorite_styles')
      .insert({ user_id: userId, style_id: styleId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Retirer un style des favoris
   */
  async removeFavoriteStyle(userId: string, styleId: string): Promise<void> {
    const { error } = await supabase
      .from('favorite_styles')
      .delete()
      .eq('user_id', userId)
      .eq('style_id', styleId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Vérifier si un style est en favori
   */
  async isFavoriteStyle(userId: string, styleId: string): Promise<boolean> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('favorite_styles')
      .select('id')
      .eq('user_id', userId)
      .eq('style_id', styleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  },

  /**
   * Récupérer tous les styles favoris d'un utilisateur
   */
  async getUserFavoriteStyles(userId: string): Promise<string[]> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('favorite_styles')
      .select('style_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(f => f.style_id);
  },

  /**
   * Toggle favori style
   */
  async toggleFavoriteStyle(userId: string, styleId: string): Promise<boolean> {
    const isFav = await this.isFavoriteStyle(userId, styleId);

    if (isFav) {
      await this.removeFavoriteStyle(userId, styleId);
      return false;
    } else {
      await this.addFavoriteStyle(userId, styleId);
      return true;
    }
  },
};
