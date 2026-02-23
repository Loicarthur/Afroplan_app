/**
 * Point d'entree pour tous les services de l'application AfroPlan
 * Centralise l'export de tous les services pour une importation simplifiee
 */

// Service d'authentification
export { authService } from './auth.service';
export type { SignUpParams, SignInParams } from './auth.service';

// Service de gestion des salons
export { salonService } from './salon.service';

// Service de gestion des reservations
export { bookingService } from './booking.service';

// Service de gestion des favoris
export { favoriteService } from './favorite.service';

// Service de gestion des avis
export { reviewService } from './review.service';

// Service de gestion des paiements
export { paymentService, COMMISSION_RATES, SUBSCRIPTION_PLANS, DEPOSIT_RATE } from './payment.service';
export type { PaymentIntent, StripeAccount, SubscriptionPlan } from './payment.service';

// Service de gestion des promotions
export { promotionService } from './promotion.service';

// Service de gestion des profils coiffeurs
export { coiffeurService } from './coiffeur.service';

// Service de gestion des clients
export { clientService } from './client.service';

/**
 * Resume des services disponibles:
 *
 * authService - Authentification et gestion des profils
 *   - signUp, signIn, signOut
 *   - getProfile, updateProfile
 *   - resetPassword, updatePassword
 *   - uploadAvatar
 *
 * salonService - Gestion des salons et services
 *   - CRUD salon: getSalons, getSalonById, createSalon, updateSalon
 *   - Recherche: searchSalons, searchSalonsAdvanced
 *   - Filtres: getHomeServiceSalons, getSalonsWithActivePromotions
 *   - Categories: getCategories, setSalonCategories
 *   - Services: createService, updateService, deleteService
 *   - Galerie: addGalleryImage, deleteGalleryImage
 *   - Stats: getSalonStats
 *
 * bookingService - Gestion des reservations
 *   - CRUD: createBooking, getBookingById
 *   - Listes: getClientBookings, getSalonBookings, getUpcomingBookings
 *   - Actions: cancelBooking, confirmBooking, completeBooking
 *   - Disponibilite: checkAvailability, getAvailableSlots
 *
 * reviewService - Gestion des avis
 *   - CRUD: createReview, updateReview, deleteReview
 *   - Listes: getClientReviews
 *   - Verification: hasClientReviewed
 *
 * favoriteService - Gestion des favoris
 *   - Actions: addFavorite, removeFavorite, toggleFavorite
 *   - Listes: getUserFavorites
 *   - Verification: isFavorite
 *
 * promotionService - Gestion des promotions
 *   - CRUD: createPromotion, updatePromotion, deletePromotion
 *   - Listes: getSalonPromotions, getActivePromotions, getFeaturedPromotions
 *   - Actions: activatePromotion, pausePromotion, expirePromotion
 *   - Validation: validatePromotion, calculateDiscount, applyPromotion
 *   - Stats: getPromotionStats
 *
 * coiffeurService - Gestion des profils coiffeurs
 *   - Profil: upsertCoiffeurDetails, getCoiffeurDetails, getCoiffeurFullProfile
 *   - Disponibilite: setAvailability, setVacationMode, setWeeklySchedule
 *   - Zones: addCoverageZone, updateCoverageZone, getCoverageZones
 *   - Service domicile: configureHomeService, checkCoverage
 *   - Recherche: searchCoiffeurs, findHomeServiceCoiffeurs
 *   - Stats: getCoiffeurStats, updateStats
 *
 * clientService - Gestion des clients
 *   - Profil: getClientProfile, updateClientProfile
 *   - Adresses: addAddress, updateAddress, deleteAddress, getAddresses
 *   - Historique: getBookingHistory, getVisitedSalons
 *   - Stats: getClientStats
 *   - Recommendations: getRecommendedSalons
 *
 * paymentService - Configuration des paiements (Stripe)
 *   - Constants de configuration
 *   - Taux de commission
 *   - Plans d'abonnement
 */
