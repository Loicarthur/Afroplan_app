/**
 * Point d'entree pour tous les services
 */

export { authService } from './auth.service';
export { salonService } from './salon.service';
export { bookingService } from './booking.service';
export { favoriteService } from './favorite.service';
export { reviewService } from './review.service';
export { paymentService, COMMISSION_RATES, SUBSCRIPTION_PLANS } from './payment.service';
export type { PaymentIntent, StripeAccount, SubscriptionPlan } from './payment.service';
