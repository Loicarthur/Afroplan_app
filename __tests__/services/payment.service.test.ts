/**
 * Tests pour le service de paiement
 */

import {
  paymentService,
  BOOKING_DEPOSIT,
  COMMISSION_RATES,
  SUBSCRIPTION_PLANS,
} from '@/services/payment.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('paymentService', () => {
  // =============================================
  // CONSTANTS TESTS
  // =============================================

  describe('constants', () => {
    it('BOOKING_DEPOSIT is 1000 centimes (10 EUR)', () => {
      expect(BOOKING_DEPOSIT).toBe(1000);
    });

    it('COMMISSION_RATES has correct values for each plan', () => {
      expect(COMMISSION_RATES.free).toBe(0.15);
      expect(COMMISSION_RATES.starter).toBe(0.10);
      expect(COMMISSION_RATES.pro).toBe(0.08);
      expect(COMMISSION_RATES.premium).toBe(0.05);
    });

    it('SUBSCRIPTION_PLANS has all four plans', () => {
      expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual(['free', 'starter', 'pro', 'premium']);
    });

    it('free plan has price 0 and 15% commission', () => {
      expect(SUBSCRIPTION_PLANS.free.price).toBe(0);
      expect(SUBSCRIPTION_PLANS.free.commission).toBe(15);
    });

    it('plans have increasing prices', () => {
      expect(SUBSCRIPTION_PLANS.free.price).toBeLessThan(SUBSCRIPTION_PLANS.starter.price);
      expect(SUBSCRIPTION_PLANS.starter.price).toBeLessThan(SUBSCRIPTION_PLANS.pro.price);
      expect(SUBSCRIPTION_PLANS.pro.price).toBeLessThan(SUBSCRIPTION_PLANS.premium.price);
    });

    it('plans have decreasing commission rates', () => {
      expect(SUBSCRIPTION_PLANS.free.commission).toBeGreaterThan(SUBSCRIPTION_PLANS.starter.commission);
      expect(SUBSCRIPTION_PLANS.starter.commission).toBeGreaterThan(SUBSCRIPTION_PLANS.pro.commission);
      expect(SUBSCRIPTION_PLANS.pro.commission).toBeGreaterThan(SUBSCRIPTION_PLANS.premium.commission);
    });
  });

  // =============================================
  // COMMISSION CALCULATION TESTS
  // =============================================

  describe('calculateDepositCommission', () => {
    it('calculates free plan commission (15%)', () => {
      const result = paymentService.calculateDepositCommission('free');
      expect(result.depositAmount).toBe(1000);
      expect(result.commission).toBe(150); // 15% of 1000
      expect(result.salonDepositAmount).toBe(850); // 1000 - 150
      expect(result.commissionRate).toBe(0.15);
    });

    it('calculates starter plan commission (10%)', () => {
      const result = paymentService.calculateDepositCommission('starter');
      expect(result.commission).toBe(100);
      expect(result.salonDepositAmount).toBe(900);
    });

    it('calculates pro plan commission (8%)', () => {
      const result = paymentService.calculateDepositCommission('pro');
      expect(result.commission).toBe(80);
      expect(result.salonDepositAmount).toBe(920);
    });

    it('calculates premium plan commission (5%)', () => {
      const result = paymentService.calculateDepositCommission('premium');
      expect(result.commission).toBe(50);
      expect(result.salonDepositAmount).toBe(950);
    });

    it('defaults to free plan when no plan specified', () => {
      const result = paymentService.calculateDepositCommission();
      expect(result.commissionRate).toBe(0.15);
    });

    it('deposit + commission = salonDepositAmount + commission always', () => {
      const plans = ['free', 'starter', 'pro', 'premium'] as const;
      plans.forEach(plan => {
        const result = paymentService.calculateDepositCommission(plan);
        expect(result.commission + result.salonDepositAmount).toBe(result.depositAmount);
      });
    });
  });

  // =============================================
  // PAYMENT INTENT TESTS
  // =============================================

  describe('createPaymentIntent', () => {
    it('creates a payment intent with correct amounts', async () => {
      // Mock: get stripe account
      const stripeAccountChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { subscription_plan: 'pro' },
          error: null,
        }),
      };

      // Mock: insert payment
      const paymentInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'pay-1', booking_id: 'b1' },
          error: null,
        }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? stripeAccountChain : paymentInsertChain;
      });

      const result = await paymentService.createPaymentIntent('b1', 5000, 's1');

      expect(result.id).toBe('pay-1');
      expect(result.depositAmount).toBe(1000);
      expect(result.totalServicePrice).toBe(5000);
      expect(result.remainingAmount).toBe(4000);
      expect(result.commission).toBe(80); // 8% pro
      expect(result.salonDepositAmount).toBe(920);
      expect(result.currency).toBe('eur');
      expect(result.status).toBe('pending');
    });

    it('throws when payment insert fails', async () => {
      const stripeAccountChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      const paymentInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? stripeAccountChain : paymentInsertChain;
      });

      await expect(
        paymentService.createPaymentIntent('b1', 5000, 's1')
      ).rejects.toThrow('Erreur création paiement: Insert failed');
    });
  });

  // =============================================
  // SALON PAYMENTS & STATS
  // =============================================

  describe('getSalonPayments', () => {
    it('fetches paginated salon payments', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'p1' }, { id: 'p2' }],
          error: null,
          count: 2,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getSalonPayments('s1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('getSalonPaymentStats', () => {
    it('calculates correct stats from payments', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [
            { amount: 1000, commission: 150, salon_amount: 850 },
            { amount: 1000, commission: 150, salon_amount: 850 },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getSalonPaymentStats('s1', 'month');
      expect(result.totalRevenue).toBe(2000);
      expect(result.totalCommission).toBe(300);
      expect(result.netRevenue).toBe(1700);
      expect(result.transactionCount).toBe(2);
      expect(result.averageTransaction).toBe(1000);
    });

    it('returns zeros when no payments', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getSalonPaymentStats('s1');
      expect(result.totalRevenue).toBe(0);
      expect(result.transactionCount).toBe(0);
    });
  });

  // =============================================
  // STRIPE ACCOUNT
  // =============================================

  describe('getStripeAccount', () => {
    it('returns stripe account data', async () => {
      const mockData = {
        id: 'sa-1',
        salon_id: 's1',
        stripe_account_id: 'acct_123',
        is_onboarded: true,
        charges_enabled: true,
        payouts_enabled: true,
        subscription_plan: 'pro',
        subscription_status: 'active',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getStripeAccount('s1');
      expect(result).not.toBeNull();
      expect(result!.stripeAccountId).toBe('acct_123');
      expect(result!.subscriptionPlan).toBe('pro');
    });

    it('returns null when no account exists', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getStripeAccount('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getSalonBalance', () => {
    it('sums unpaid completed payments', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // Chain: eq(salon_id) -> eq(status) -> eq(is_paid_out) resolves
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({
          data: [{ salon_amount: 850 }, { salon_amount: 920 }],
          error: null,
        });
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.getSalonBalance('s1');
      expect(result.availableBalance).toBe(1770);
      expect(result.currency).toBe('eur');
    });
  });

  describe('confirmPayment', () => {
    it('confirms payment and updates booking status', async () => {
      const paymentUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'p1', booking_id: 'b1', status: 'completed' },
          error: null,
        }),
      };

      const bookingUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? paymentUpdateChain : bookingUpdateChain;
      });

      const result = await paymentService.confirmPayment('p1', 'pi_stripe_123');
      expect(result.status).toBe('completed');
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });

  describe('initiateRefund', () => {
    it('updates payment status to refunded', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'p1', status: 'refunded', refund_reason: 'Client request' },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await paymentService.initiateRefund('p1', 'Client request');
      expect(result.status).toBe('refunded');
    });
  });
});
