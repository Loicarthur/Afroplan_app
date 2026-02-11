/**
 * Tests pour le service d'authentification
 */

import { authService } from '@/services/auth.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn(),
      admin: { deleteUser: jest.fn() },
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.png' } })),
      })),
    },
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
});

describe('authService', () => {
  // =============================================
  // VALIDATION TESTS
  // =============================================

  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(authService.validateEmail('test@example.com')).toEqual({
        isValid: true,
        error: undefined,
      });
      expect(authService.validateEmail('user.name@domain.fr')).toEqual({
        isValid: true,
        error: undefined,
      });
    });

    it('rejects empty email', () => {
      const result = authService.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects invalid email format', () => {
      expect(authService.validateEmail('notanemail').isValid).toBe(false);
      expect(authService.validateEmail('missing@domain').isValid).toBe(false);
      expect(authService.validateEmail('@nodomain.com').isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('accepts valid passwords', () => {
      expect(authService.validatePassword('abc123').isValid).toBe(true);
      expect(authService.validatePassword('MonMotDePasse1').isValid).toBe(true);
    });

    it('rejects empty password', () => {
      expect(authService.validatePassword('').isValid).toBe(false);
    });

    it('rejects password shorter than 6 characters', () => {
      expect(authService.validatePassword('ab1').isValid).toBe(false);
    });

    it('rejects password longer than 72 characters', () => {
      const longPassword = 'a1' + 'x'.repeat(72);
      expect(authService.validatePassword(longPassword).isValid).toBe(false);
    });

    it('rejects password without letters or numbers', () => {
      expect(authService.validatePassword('123456').isValid).toBe(false);
      expect(authService.validatePassword('abcdef').isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('accepts valid French phone numbers', () => {
      expect(authService.validatePhone('0612345678').isValid).toBe(true);
      expect(authService.validatePhone('+33612345678').isValid).toBe(true);
    });

    it('accepts empty/undefined phone (optional field)', () => {
      expect(authService.validatePhone(undefined).isValid).toBe(true);
      expect(authService.validatePhone('').isValid).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(authService.validatePhone('123').isValid).toBe(false);
      expect(authService.validatePhone('abcdefghij').isValid).toBe(false);
    });
  });

  describe('validateSignUp', () => {
    it('validates a complete valid signup', () => {
      const result = authService.validateSignUp({
        email: 'test@example.com',
        password: 'mypass1',
        fullName: 'Jean Dupont',
        phone: '0612345678',
        role: 'client',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('returns all errors for invalid signup', () => {
      const result = authService.validateSignUp({
        email: '',
        password: '',
        fullName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.fullName).toBeDefined();
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats a French phone number correctly', () => {
      expect(authService.formatPhoneNumber('0612345678')).toBe('06 12 34 56 78');
    });

    it('returns empty string for empty input', () => {
      expect(authService.formatPhoneNumber('')).toBe('');
      expect(authService.formatPhoneNumber(undefined)).toBe('');
    });

    it('returns original string for unrecognized format', () => {
      expect(authService.formatPhoneNumber('12345')).toBe('12345');
    });
  });

  // =============================================
  // AUTH OPERATIONS TESTS
  // =============================================

  describe('signUp', () => {
    it('calls supabase auth signUp with correct params', async () => {
      const mockResponse = {
        data: { user: { id: '123' }, session: null },
        error: null,
      };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'pass123',
        fullName: 'Test User',
        role: 'client',
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass123',
        options: {
          data: {
            full_name: 'Test User',
            phone: undefined,
            role: 'client',
          },
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('throws error when supabase returns error', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      });

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'pass123',
          fullName: 'Test',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('throws when supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'pass123',
          fullName: 'Test',
        })
      ).rejects.toThrow('Supabase non configure');
    });
  });

  describe('signIn', () => {
    it('calls supabase signInWithPassword', async () => {
      const mockData = {
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockData);

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'pass123',
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass123',
      });
      expect(result).toEqual(mockData.data);
    });

    it('throws on auth error', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        authService.signIn({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns profile data', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'client',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await authService.getProfile('123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(mockProfile);
    });
  });
});
