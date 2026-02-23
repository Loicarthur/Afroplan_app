/**
 * Tests pour le service de reservations
 */

import { bookingService } from '@/services/booking.service';
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

describe('bookingService', () => {
  describe('createBooking', () => {
    it('creates a booking successfully', async () => {
      const mockBooking = {
        id: 'booking-1',
        client_id: 'client-1',
        salon_id: 'salon-1',
        service_id: 'service-1',
        booking_date: '2026-03-01',
        start_time: '10:00',
        end_time: '11:00',
        status: 'pending',
        total_price: 50,
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.createBooking({
        client_id: 'client-1',
        salon_id: 'salon-1',
        service_id: 'service-1',
        booking_date: '2026-03-01',
        start_time: '10:00',
        end_time: '11:00',
        total_price: 50,
      } as any);

      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(result.id).toBe('booking-1');
      expect(result.status).toBe('pending');
    });

    it('throws on error', async () => {
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Conflict' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(
        bookingService.createBooking({} as any)
      ).rejects.toThrow('Conflict');
    });

    it('throws when supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

      await expect(
        bookingService.createBooking({} as any)
      ).rejects.toThrow('Supabase non configure');
    });
  });

  describe('updateBookingStatus', () => {
    it('updates status to confirmed', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'booking-1', status: 'confirmed' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.updateBookingStatus('booking-1', 'confirmed');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('cancelBooking', () => {
    it('delegates to updateBookingStatus with cancelled status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'booking-1', status: 'cancelled' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.cancelBooking('booking-1');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('confirmBooking', () => {
    it('delegates to updateBookingStatus with confirmed status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'booking-1', status: 'confirmed' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.confirmBooking('booking-1');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('completeBooking', () => {
    it('delegates to updateBookingStatus with completed status', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'booking-1', status: 'completed' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.completeBooking('booking-1');
      expect(result.status).toBe('completed');
    });
  });

  describe('getClientBookings', () => {
    it('fetches client bookings with pagination', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'b1' }, { id: 'b2' }],
          error: null,
          count: 2,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await bookingService.getClientBookings('client-1', undefined, 1);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('filters by status when provided', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await bookingService.getClientBookings('client-1', 'pending', 1);

      // eq is called for both client_id and status
      expect(mockChain.eq).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkAvailability', () => {
    it('returns true when no conflicting bookings', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const available = await bookingService.checkAvailability(
        'salon-1', '2026-03-01', '10:00', '11:00'
      );
      expect(available).toBe(true);
    });

    it('returns false when conflicting bookings exist', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-booking' }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const available = await bookingService.checkAvailability(
        'salon-1', '2026-03-01', '10:00', '11:00'
      );
      expect(available).toBe(false);
    });
  });
});
