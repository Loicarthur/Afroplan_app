/**
 * Tests pour le service coiffeur
 */

import { coiffeurService } from '@/services/coiffeur.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
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

describe('coiffeurService', () => {
  describe('upsertCoiffeurDetails', () => {
    it('upserts coiffeur details', async () => {
      const mockDetails = { id: 'd1', user_id: 'u1', is_available: true };
      const mockChain = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDetails, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.upsertCoiffeurDetails({ user_id: 'u1' } as any);
      expect(result.user_id).toBe('u1');
    });
  });

  describe('getCoiffeurDetails', () => {
    it('returns coiffeur details', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'd1', is_available: true },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.getCoiffeurDetails('u1');
      expect(result).not.toBeNull();
      expect(result!.is_available).toBe(true);
    });

    it('returns null for non-existent coiffeur', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.getCoiffeurDetails('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateCoiffeurDetails', () => {
    it('updates details successfully', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'd1', is_available: false },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.updateCoiffeurDetails('u1', { is_available: false } as any);
      expect(result.is_available).toBe(false);
    });
  });

  describe('setAvailability', () => {
    it('sets availability to true', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { is_available: true },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.setAvailability('u1', true);
      expect(result.is_available).toBe(true);
    });
  });

  describe('setVacationMode', () => {
    it('activates vacation mode with dates', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { vacation_mode: true, vacation_start: '2026-03-01', vacation_end: '2026-03-15' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.setVacationMode('u1', true, '2026-03-01', '2026-03-15');
      expect(result.vacation_mode).toBe(true);
    });
  });

  describe('addAvailability', () => {
    it('adds availability slot', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'a1', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.addAvailability({
        coiffeur_id: 'u1',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      } as any);
      expect(result.day_of_week).toBe(1);
    });
  });

  describe('deleteAvailability', () => {
    it('deletes availability slot', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(coiffeurService.deleteAvailability('a1')).resolves.toBeUndefined();
    });
  });

  describe('getCoiffeurAvailabilities', () => {
    it('returns sorted availabilities', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              { day_of_week: 1, start_time: '09:00' },
              { day_of_week: 2, start_time: '10:00' },
            ],
            error: null,
          }),
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.getCoiffeurAvailabilities('u1');
      expect(result).toHaveLength(2);
    });
  });

  describe('addCoverageZone', () => {
    it('adds a coverage zone', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'z1', city: 'Paris', radius_km: 10 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.addCoverageZone({
        coiffeur_id: 'u1',
        city: 'Paris',
        radius_km: 10,
      } as any);
      expect(result.city).toBe('Paris');
    });
  });

  describe('deleteCoverageZone', () => {
    it('deletes a coverage zone', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(coiffeurService.deleteCoverageZone('z1')).resolves.toBeUndefined();
    });
  });

  describe('getCoverageZones', () => {
    it('returns active coverage zones', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 'z1', city: 'Paris' }, { id: 'z2', city: 'Lyon' }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.getCoverageZones('u1');
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateDistance', () => {
    it('calculates correct distance between two points', () => {
      // Paris to Lyon ~ 392km
      const distance = coiffeurService.calculateDistance(48.8566, 2.3522, 45.7640, 4.8357);
      expect(distance).toBeGreaterThan(380);
      expect(distance).toBeLessThan(410);
    });

    it('returns 0 for same point', () => {
      const distance = coiffeurService.calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBeCloseTo(0);
    });
  });

  describe('toRad', () => {
    it('converts degrees to radians', () => {
      expect(coiffeurService.toRad(180)).toBeCloseTo(Math.PI);
      expect(coiffeurService.toRad(0)).toBe(0);
      expect(coiffeurService.toRad(360)).toBeCloseTo(2 * Math.PI);
    });
  });

  describe('configureHomeService', () => {
    it('enables home service with fee', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { offers_home_service: true, home_service_fee: 15 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await coiffeurService.configureHomeService('u1', {
        enabled: true,
        fee: 15,
        maxDistance: 20,
      });
      expect(result.offers_home_service).toBe(true);
    });
  });
});
