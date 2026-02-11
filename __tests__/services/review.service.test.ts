/**
 * Tests pour le service d'avis (reviews)
 */

import { reviewService } from '@/services/review.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
});

describe('reviewService', () => {
  describe('createReview', () => {
    it('creates a review and updates salon rating', async () => {
      const mockReview = { id: 'r1', salon_id: 's1', client_id: 'c1', rating: 5, comment: 'Super!' };

      // First call: insert review
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReview, error: null }),
      };

      // Second call: select reviews for rating update
      const selectRatingsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ rating: 5 }], error: null }),
      };

      // Third call: update salon rating
      const updateSalonChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return insertChain;
        if (callCount === 2) return selectRatingsChain;
        return updateSalonChain;
      });

      const result = await reviewService.createReview({
        salon_id: 's1',
        client_id: 'c1',
        rating: 5,
        comment: 'Super!',
      } as any);

      expect(result).toEqual(mockReview);
      expect(supabase.from).toHaveBeenCalledWith('reviews');
    });

    it('throws when supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

      await expect(
        reviewService.createReview({} as any)
      ).rejects.toThrow('Supabase non configure');
    });
  });

  describe('updateReview', () => {
    it('updates a review and recalculates salon rating', async () => {
      const updatedReview = { id: 'r1', salon_id: 's1', rating: 4 };

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedReview, error: null }),
      };

      const selectRatingsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ rating: 4 }, { rating: 5 }], error: null }),
      };

      const updateSalonChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return updateChain;
        if (callCount === 2) return selectRatingsChain;
        return updateSalonChain;
      });

      const result = await reviewService.updateReview('r1', { rating: 4 });
      expect(result.rating).toBe(4);
    });
  });

  describe('deleteReview', () => {
    it('deletes a review and updates salon rating', async () => {
      // First call: get salon_id before delete
      const getChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { salon_id: 's1' }, error: null }),
      };

      // Second call: delete
      const deleteChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      // Third call: get remaining reviews for rating
      const ratingsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Fourth call: update salon to 0
      const updateSalonChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return getChain;
        if (callCount === 2) return deleteChain;
        if (callCount === 3) return ratingsChain;
        return updateSalonChain;
      });

      await expect(reviewService.deleteReview('r1')).resolves.toBeUndefined();
    });
  });

  describe('getClientReviews', () => {
    it('returns client reviews ordered by date', async () => {
      const mockReviews = [
        { id: 'r1', rating: 5, comment: 'Genial' },
        { id: 'r2', rating: 4, comment: 'Bien' },
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockReviews, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await reviewService.getClientReviews('c1');
      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5);
    });

    it('returns empty array when no reviews', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await reviewService.getClientReviews('c1');
      expect(result).toEqual([]);
    });
  });

  describe('hasClientReviewed', () => {
    it('returns true if client has reviewed the salon', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'r1' }, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await reviewService.hasClientReviewed('c1', 's1');
      expect(result).toBe(true);
    });

    it('returns false if client has not reviewed', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await reviewService.hasClientReviewed('c1', 's1');
      expect(result).toBe(false);
    });
  });

  describe('updateSalonRating', () => {
    it('calculates correct average rating', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
          error: null,
        }),
      };

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain : updateChain;
      });

      await reviewService.updateSalonRating('s1');

      expect(updateChain.update).toHaveBeenCalledWith({
        rating: 4,
        reviews_count: 3,
      });
    });

    it('sets rating to 0 when no reviews exist', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain : updateChain;
      });

      await reviewService.updateSalonRating('s1');

      expect(updateChain.update).toHaveBeenCalledWith({
        rating: 0,
        reviews_count: 0,
      });
    });
  });
});
