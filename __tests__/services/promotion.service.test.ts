/**
 * Tests pour le service de promotions
 */

import { promotionService } from '@/services/promotion.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
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

describe('promotionService', () => {
  describe('createPromotion', () => {
    it('creates a promotion successfully', async () => {
      const mockPromo = { id: 'promo-1', code: 'AFRO20', type: 'percentage', value: 20 };
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPromo, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.createPromotion({ code: 'AFRO20' } as any);
      expect(result.code).toBe('AFRO20');
    });

    it('throws on error', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Duplicate code' } }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(promotionService.createPromotion({} as any)).rejects.toThrow('Duplicate code');
    });
  });

  describe('updatePromotion', () => {
    it('updates a promotion', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', status: 'active' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.updatePromotion('promo-1', { status: 'active' } as any);
      expect(result.status).toBe('active');
    });
  });

  describe('deletePromotion', () => {
    it('deletes a promotion', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(promotionService.deletePromotion('promo-1')).resolves.toBeUndefined();
    });
  });

  describe('getPromotionById', () => {
    it('returns promotion with salon data', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', salon: { name: 'Test Salon' } },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionById('promo-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('promo-1');
    });

    it('returns null for non-existent promotion', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getSalonPromotions', () => {
    it('returns paginated promotions', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'p1' }, { id: 'p2' }],
          error: null,
          count: 2,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getSalonPromotions('s1', undefined, 1);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('activatePromotion / pausePromotion / expirePromotion', () => {
    it('activatePromotion calls updatePromotion with active status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', status: 'active' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.activatePromotion('promo-1');
      expect(result.status).toBe('active');
    });

    it('pausePromotion returns paused status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', status: 'paused' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.pausePromotion('promo-1');
      expect(result.status).toBe('paused');
    });

    it('expirePromotion returns expired status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', status: 'expired' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.expirePromotion('promo-1');
      expect(result.status).toBe('expired');
    });
  });

  describe('getPromotionByCode', () => {
    it('finds promotion by code', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'promo-1', code: 'AFRO20' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionByCode('afro20');
      expect(result).not.toBeNull();
    });

    it('returns null for invalid code', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionByCode('INVALID');
      expect(result).toBeNull();
    });
  });

  describe('applyPromotion', () => {
    it('records promotion usage', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'usage-1', promotion_id: 'promo-1', discount_applied: 500 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.applyPromotion('promo-1', 'u1', 'b1', 500);
      expect(result.discount_applied).toBe(500);
    });
  });

  describe('getPromotionStats', () => {
    it('calculates promotion statistics', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { discount_applied: 500, user_id: 'u1' },
            { discount_applied: 300, user_id: 'u2' },
            { discount_applied: 500, user_id: 'u1' },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionStats('promo-1');
      expect(result.totalUses).toBe(3);
      expect(result.totalDiscountGiven).toBe(1300);
      expect(result.uniqueUsers).toBe(2);
    });

    it('returns zeros when no usages', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await promotionService.getPromotionStats('promo-1');
      expect(result.totalUses).toBe(0);
      expect(result.totalDiscountGiven).toBe(0);
      expect(result.uniqueUsers).toBe(0);
    });
  });
});
