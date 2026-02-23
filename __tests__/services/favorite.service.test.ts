/**
 * Tests pour le service de favoris
 */

import { favoriteService } from '@/services/favorite.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
});

describe('favoriteService', () => {
  describe('addFavorite', () => {
    it('adds a favorite successfully', async () => {
      const mockFavorite = { id: 'fav-1', user_id: 'user-1', salon_id: 'salon-1' };
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFavorite, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await favoriteService.addFavorite('user-1', 'salon-1');

      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(result).toEqual(mockFavorite);
    });

    it('throws when supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

      await expect(
        favoriteService.addFavorite('user-1', 'salon-1')
      ).rejects.toThrow('Supabase non configure');
    });
  });

  describe('removeFavorite', () => {
    it('removes a favorite successfully', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(
        favoriteService.removeFavorite('user-1', 'salon-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('isFavorite', () => {
    it('returns true when salon is favorited', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'fav-1' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await favoriteService.isFavorite('user-1', 'salon-1');
      expect(result).toBe(true);
    });

    it('returns false when salon is not favorited', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await favoriteService.isFavorite('user-1', 'salon-1');
      expect(result).toBe(false);
    });
  });

  describe('getUserFavorites', () => {
    it('returns user favorite salons', async () => {
      const favoritesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ salon_id: 'salon-1' }, { salon_id: 'salon-2' }],
          error: null,
        }),
      };

      const salonsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 'salon-1', name: 'Salon A' },
            { id: 'salon-2', name: 'Salon B' },
          ],
          error: null,
        }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? favoritesChain : salonsChain;
      });

      const result = await favoriteService.getUserFavorites('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Salon A');
    });

    it('returns empty array when no favorites', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await favoriteService.getUserFavorites('user-1');
      expect(result).toEqual([]);
    });
  });
});
