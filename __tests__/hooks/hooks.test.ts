/**
 * Tests pour les hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

// Mock useColorScheme
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

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
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Mock AuthContext for useAuthGuard
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  })),
}));

describe('useThemeColor', () => {
  const { useColorScheme } = require('@/hooks/use-color-scheme');

  beforeEach(() => {
    jest.clearAllMocks();
    useColorScheme.mockReturnValue('light');
  });

  it('returns light theme color by default', () => {
    const { result } = renderHook(() =>
      useThemeColor({}, 'primary')
    );
    expect(result.current).toBe(Colors.light.primary);
  });

  it('returns dark theme color when dark mode', () => {
    useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'primary')
    );
    expect(result.current).toBe(Colors.dark.primary);
  });

  it('uses custom color from props when provided', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#FF0000' }, 'primary')
    );
    expect(result.current).toBe('#FF0000');
  });

  it('uses dark custom color from props in dark mode', () => {
    useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ dark: '#00FF00' }, 'primary')
    );
    expect(result.current).toBe('#00FF00');
  });

  it('falls back to theme color when prop not provided for current theme', () => {
    const { result } = renderHook(() =>
      useThemeColor({ dark: '#00FF00' }, 'primary')
    );
    // In light mode, no light prop provided, should fall back to theme
    expect(result.current).toBe(Colors.light.primary);
  });
});

describe('useAuthGuard', () => {
  const { useAuth } = require('@/contexts/AuthContext');
  // Need to re-import after mock
  const { useAuthGuard } = require('@/hooks/use-auth-guard');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns isAuthenticated false when not logged in', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAuthGuard());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.showAuthModal).toBe(false);
  });

  it('shows auth modal when requireAuth is called while not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAuthGuard());

    act(() => {
      result.current.requireAuth(() => {});
    });

    expect(result.current.showAuthModal).toBe(true);
  });

  it('executes callback when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    const { result } = renderHook(() => useAuthGuard());
    const callback = jest.fn();

    act(() => {
      result.current.requireAuth(callback);
    });

    expect(callback).toHaveBeenCalled();
    expect(result.current.showAuthModal).toBe(false);
  });

  it('allows closing auth modal', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAuthGuard());

    act(() => {
      result.current.requireAuth(() => {});
    });
    expect(result.current.showAuthModal).toBe(true);

    act(() => {
      result.current.setShowAuthModal(false);
    });
    expect(result.current.showAuthModal).toBe(false);
  });
});

describe('useCreateBooking', () => {
  jest.mock('@/services', () => ({
    bookingService: {
      createBooking: jest.fn(),
    },
  }));

  const { bookingService } = require('@/services');
  const { useCreateBooking } = require('@/hooks/use-bookings');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with no loading and no error', () => {
    const { result } = renderHook(() => useCreateBooking());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates booking successfully', async () => {
    const mockBooking = { id: 'b1', status: 'pending' };
    bookingService.createBooking.mockResolvedValue(mockBooking);

    const { result } = renderHook(() => useCreateBooking());

    let createdBooking: any;
    await act(async () => {
      createdBooking = await result.current.createBooking({} as any);
    });

    expect(createdBooking).toEqual(mockBooking);
    expect(result.current.error).toBeNull();
  });

  it('handles creation error', async () => {
    bookingService.createBooking.mockRejectedValue(new Error('Slot taken'));

    const { result } = renderHook(() => useCreateBooking());

    let createdBooking: any;
    await act(async () => {
      createdBooking = await result.current.createBooking({} as any);
    });

    expect(createdBooking).toBeNull();
    expect(result.current.error).toBe('Slot taken');
  });
});

describe('useSearchSalons', () => {
  const { useSearchSalons } = require('@/hooks/use-salons');

  it('starts with empty results', () => {
    const { result } = renderHook(() => useSearchSalons());
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears results with clear()', () => {
    const { result } = renderHook(() => useSearchSalons());

    act(() => {
      result.current.clear();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('does not search with empty query', async () => {
    const { result } = renderHook(() => useSearchSalons());

    await act(async () => {
      await result.current.search('   ');
    });

    // Empty query should not produce results
    expect(result.current.results).toEqual([]);
  });
});
