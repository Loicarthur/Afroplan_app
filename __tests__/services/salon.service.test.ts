/**
 * Tests pour le service salon
 */

import { salonService } from '@/services/salon.service';
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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
});

describe('salonService', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points correctly', () => {
      // Paris to Lyon ~ 392 km
      const distance = salonService.calculateDistance(
        48.8566, 2.3522, // Paris
        45.7640, 4.8357  // Lyon
      );
      expect(distance).toBeGreaterThan(380);
      expect(distance).toBeLessThan(410);
    });

    it('returns 0 for same point', () => {
      const distance = salonService.calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('handles negative coordinates', () => {
      const distance = salonService.calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('toRad', () => {
    it('converts degrees to radians', () => {
      expect(salonService.toRad(180)).toBeCloseTo(Math.PI, 5);
      expect(salonService.toRad(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(salonService.toRad(0)).toBe(0);
    });
  });

  describe('getSalons', () => {
    it('calls supabase with correct query for default params', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };
      // Final resolution
      mockChain.range.mockResolvedValue({
        data: [{ id: '1', name: 'Salon Test' }],
        error: null,
        count: 1,
      });

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await salonService.getSalons(1);

      expect(supabase.from).toHaveBeenCalledWith('salons');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('applies city filter', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };
      mockChain.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await salonService.getSalons(1, { city: 'Paris' });

      expect(mockChain.ilike).toHaveBeenCalledWith('city', '%Paris%');
    });

    it('throws on supabase error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(salonService.getSalons(1)).rejects.toThrow('Database error');
    });
  });

  describe('searchSalons', () => {
    it('searches with query string', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: '1', name: 'Afro Salon' }],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await salonService.searchSalons('Afro');

      expect(supabase.from).toHaveBeenCalledWith('salons');
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no results', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await salonService.searchSalons('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getPopularSalons', () => {
    it('fetches popular salons with correct filters', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: '1', name: 'Top Salon', rating: 4.9 }],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await salonService.getPopularSalons(5);

      expect(result).toHaveLength(1);
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('getSalonById', () => {
    it('returns null for non-existent salon', async () => {
      const profileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await salonService.getSalonById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
