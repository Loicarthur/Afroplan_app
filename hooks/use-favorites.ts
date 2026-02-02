/**
 * Hook pour la gestion des favoris
 */

import { useState, useEffect, useCallback } from 'react';
import { favoriteService } from '@/services';
import { Salon } from '@/types';

export function useFavorites(userId: string) {
  const [favorites, setFavorites] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await favoriteService.getUserFavorites(userId);
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (salonId: string) => {
    try {
      await favoriteService.removeFavorite(userId, salonId);
      setFavorites((prev) => prev.filter((s) => s.id !== salonId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  return { favorites, isLoading, error, refresh: fetchFavorites, removeFavorite };
}

export function useFavorite(userId: string, salonId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!userId || !salonId) {
        setIsFavorite(false);
        setIsLoading(false);
        return;
      }

      try {
        const result = await favoriteService.isFavorite(userId, salonId);
        setIsFavorite(result);
      } catch (err) {
        console.error('Erreur lors de la verification du favori:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [userId, salonId]);

  const toggle = async () => {
    if (!userId || !salonId || isToggling) return;

    setIsToggling(true);
    try {
      const newState = await favoriteService.toggleFavorite(userId, salonId);
      setIsFavorite(newState);
    } catch (err) {
      console.error('Erreur lors du toggle du favori:', err);
      throw err;
    } finally {
      setIsToggling(false);
    }
  };

  return { isFavorite, isLoading, isToggling, toggle };
}
