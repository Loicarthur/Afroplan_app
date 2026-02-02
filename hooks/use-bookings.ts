/**
 * Hook pour la gestion des reservations
 */

import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '@/services';
import { Booking, BookingWithDetails, BookingInsert } from '@/types';

export function useBookings(clientId: string, status?: Booking['status']) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBookings = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await bookingService.getClientBookings(clientId, status, pageNum);
      setBookings((prev) => (reset ? response.data : [...prev, ...response.data]));
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, status]);

  useEffect(() => {
    fetchBookings(1, true);
  }, [fetchBookings]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchBookings(page + 1);
    }
  };

  const refresh = () => {
    fetchBookings(1, true);
  };

  return { bookings, isLoading, error, hasMore, loadMore, refresh };
}

export function useBooking(id: string) {
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await bookingService.getBookingById(id);
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const cancel = async () => {
    if (!id) return;

    try {
      await bookingService.cancelBooking(id);
      setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  return { booking, isLoading, error, cancel };
}

export function useUpcomingBookings(clientId: string, limit: number = 5) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getUpcomingBookings(clientId, limit);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, isLoading, error, refresh: fetchBookings };
}

export function useCreateBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (booking: BookingInsert): Promise<Booking | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.createBooking(booking);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createBooking, isLoading, error };
}

export function useAvailableSlots(salonId: string, date: string, serviceDuration: number) {
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!salonId || !date || !serviceDuration) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await bookingService.getAvailableSlots(salonId, date, serviceDuration);
        setSlots(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [salonId, date, serviceDuration]);

  return { slots, isLoading, error };
}
