/**
 * Hook pour la gestion des salons
 */

import { useState, useEffect, useCallback } from 'react';
import { salonService } from '@/services';
import { Salon, SalonWithDetails, SalonFilters, Category, PaginatedResponse } from '@/types';

export function useSalons(filters?: SalonFilters) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchSalons = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await salonService.getSalons(pageNum, filters);
      setSalons((prev) => (reset ? response.data : [...prev, ...response.data]));
      setHasMore(response.hasMore);
      setTotal(response.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSalons(1, true);
  }, [fetchSalons]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchSalons(page + 1);
    }
  };

  const refresh = () => {
    fetchSalons(1, true);
  };

  return {
    salons,
    isLoading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}

export function useSalon(id: string) {
  const [salon, setSalon] = useState<SalonWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalon = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await salonService.getSalonById(id);
        setSalon(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalon();
  }, [id]);

  return { salon, isLoading, error };
}

export function usePopularSalons(limit: number = 6) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await salonService.getPopularSalons(limit);
        setSalons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalons();
  }, [limit]);

  return { salons, isLoading, error };
}

export function useSearchSalons() {
  const [results, setResults] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await salonService.searchSalons(query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, isLoading, error, search, clear };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await salonService.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

export function useSalonsByCategory(categorySlug: string) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchSalons = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    if (!categorySlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await salonService.getSalonsByCategory(categorySlug, pageNum);
      setSalons((prev) => (reset ? response.data : [...prev, ...response.data]));
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchSalons(1, true);
  }, [fetchSalons]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchSalons(page + 1);
    }
  };

  return { salons, isLoading, error, hasMore, loadMore };
}
