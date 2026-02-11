/**
 * Tests pour le service client
 */

import { clientService } from '@/services/client.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
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

describe('clientService', () => {
  // =============================================
  // PROFILE TESTS
  // =============================================

  describe('getClientProfile', () => {
    it('returns client profile', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'u1', full_name: 'Jean', role: 'client' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getClientProfile('u1');
      expect(result).not.toBeNull();
      expect(result!.full_name).toBe('Jean');
    });

    it('returns null for non-existent profile', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getClientProfile('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on unexpected error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '500', message: 'Server error' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(clientService.getClientProfile('u1')).rejects.toThrow('Server error');
    });
  });

  describe('updateClientProfile', () => {
    it('updates client profile', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'u1', full_name: 'Jean Updated' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.updateClientProfile('u1', { full_name: 'Jean Updated' } as any);
      expect(result.full_name).toBe('Jean Updated');
    });
  });

  // =============================================
  // ADDRESS TESTS
  // =============================================

  describe('addAddress', () => {
    it('adds an address', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'addr-1', city: 'Paris', is_default: false },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.addAddress({
        user_id: 'u1',
        city: 'Paris',
        is_default: false,
      } as any);
      expect(result.city).toBe('Paris');
    });
  });

  describe('getAddresses', () => {
    it('returns sorted addresses', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              { id: 'addr-1', is_default: true },
              { id: 'addr-2', is_default: false },
            ],
            error: null,
          }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getAddresses('u1');
      expect(result).toHaveLength(2);
      expect(result[0].is_default).toBe(true);
    });

    it('returns empty array when no addresses', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getAddresses('u1');
      expect(result).toEqual([]);
    });
  });

  describe('deleteAddress', () => {
    it('deletes an address', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(clientService.deleteAddress('addr-1', 'u1')).resolves.toBeUndefined();
    });
  });

  describe('getAddressById', () => {
    it('returns address by id', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'addr-1', city: 'Paris' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getAddressById('addr-1', 'u1');
      expect(result).not.toBeNull();
    });

    it('returns null for non-existent address', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getAddressById('nonexistent', 'u1');
      expect(result).toBeNull();
    });
  });

  // =============================================
  // BOOKING HISTORY
  // =============================================

  describe('getBookingHistory', () => {
    it('returns paginated booking history', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'b1' }, { id: 'b2' }],
          error: null,
          count: 15,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.getBookingHistory('u1', 1);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.hasMore).toBe(true);
      expect(result.totalPages).toBe(2);
    });
  });

  // =============================================
  // STATS
  // =============================================

  describe('hasVisitedSalon', () => {
    it('returns true if visited', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Chain: eq -> eq -> eq -> resolves with count
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ count: 3 });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.hasVisitedSalon('u1', 's1');
      expect(result).toBe(true);
    });

    it('returns false if never visited', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ count: 0 });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.hasVisitedSalon('u1', 's1');
      expect(result).toBe(false);
    });
  });

  describe('isFirstBooking', () => {
    it('returns true for new client', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ count: 0 });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.isFirstBooking('u1');
      expect(result).toBe(true);
    });

    it('returns false for returning client', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ count: 5 });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await clientService.isFirstBooking('u1');
      expect(result).toBe(false);
    });
  });
});
