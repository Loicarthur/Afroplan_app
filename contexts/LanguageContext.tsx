/**
 * Language Context - AfroPlan
 * Système de traduction multi-langues
 * Langues supportées: FR, EN, DE, ES
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type Language = 'fr' | 'en' | 'de' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  languages: { code: Language; name: string; flag: string }[];
}

// Available languages
const LANGUAGES = [
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
];

// Translations
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
    'common.next': 'Suivant',
    'common.back': 'Retour',
    'common.search': 'Rechercher',
    'common.seeAll': 'Voir tout',
    'common.seeResults': 'Voir les résultats',

    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.noAccount': 'Pas de compte ?',
    'auth.hasAccount': 'Déjà un compte ?',
    'auth.loginRequired': 'Connexion requise',
    'auth.loginRequiredMessage': 'Vous devez être connecté pour effectuer un paiement.',
    'common.errorOccurred': 'Une erreur est survenue. Veuillez réessayer.',

    // Home
    'home.welcome': 'Bienvenue sur AfroPlan',
    'home.searchSalon': 'Rechercher mon salon / coiffeur',
    'home.searchSubtitle': 'Trouve le style qui te correspond',
    'home.promotions': 'Offres du moment',
    'home.hairstyles': 'Styles de coiffure',
    'home.nearbyCoiffeurs': 'Coiffeurs à proximité',
    'home.popularSalons': 'Salons populaires',
    'home.tipsAndInspiration': 'Conseils & Inspiration',
    'home.areYouCoiffeur': 'Tu es coiffeur(se) ?',
    'home.joinAfroPlanPro': 'Rejoins AfroPlan Pro et développe ton activité',
    'home.discoverPro': 'Découvrir AfroPlan Pro',

    // Search Flow
    'search.findCoiffeur': 'Trouve facilement ton coiffeur afro',
    'search.quickQuestions': 'Quelques questions rapides pour te proposer les meilleurs salons adaptés à tes besoins.',
    'search.chooseStyle': 'Choisis ta coiffure',
    'search.whatStyle': 'Quel style te ferait plaisir ?',
    'search.quickFilter': 'Filtre rapide',
    'search.optional': 'Optionnel - Affine ta recherche',
    'search.hairType': 'Type de cheveux',
    'search.whereCoiffeur': 'Où souhaites-tu te faire coiffer ?',
    'search.inSalon': 'En salon',
    'search.atHome': 'À domicile',
    'search.goToSalon': 'Se déplacer au salon',
    'search.coiffeurComesHome': 'Le coiffeur vient chez vous',
    'search.budgetDistance': 'Budget & Distance',
    'search.maxBudget': 'Budget maximum',
    'search.maxDistance': 'Distance maximum',
    'search.showAllSalons': 'Je veux voir tous les salons (ignorer les filtres)',
    'search.paymentInfo': 'Tu pourras choisir de payer le montant total ou un acompte lors de la réservation.',
    'search.canGoBack': 'Tu peux revenir en arrière à tout moment',
    'search.quickPay': 'Paiement rapide',

    // Booking
    'booking.book': 'Réserver',
    'booking.confirmed': 'Confirmé',
    'booking.pending': 'En attente',
    'booking.cancelled': 'Annulé',
    'booking.completed': 'Terminé',
    'booking.yourBookings': 'Mes réservations',
    'booking.upcoming': 'À venir',
    'booking.past': 'Passées',

    // Chat
    'chat.writeMessage': 'Écrivez votre message...',
    'chat.online': 'En ligne',
    'chat.reservationConfirmed': 'Réservation confirmée ! Vous pouvez maintenant discuter.',
    'chat.willBeLate': "J'aurai un peu de retard",
    'chat.onMyWay': 'Je suis en route',
    'chat.whatTime': 'À quelle heure exactement ?',
    'chat.sendAddress': "Pouvez-vous m'envoyer l'adresse ?",

    // Coiffeur Dashboard
    'coiffeur.developActivity': 'Développez votre activité',
    'coiffeur.joinCommunity': 'Rejoignez la communauté AfroPlan Pro et boostez votre salon',
    'coiffeur.rdvManagement': 'Gestion des RDV',
    'coiffeur.manageReservations': 'Gérez facilement vos réservations',
    'coiffeur.moreClients': 'Plus de clients',
    'coiffeur.increaseVisibility': 'Augmentez votre visibilité',
    'coiffeur.statistics': 'Statistiques',
    'coiffeur.trackPerformance': 'Suivez vos performances',
    'coiffeur.payments': 'Paiements',
    'coiffeur.securePayment': 'Encaissez en toute sécurité',
    'coiffeur.readyToStart': 'Prêt à commencer ?',
    'coiffeur.registerFree': 'Inscrivez-vous gratuitement et commencez à recevoir des réservations',
    'coiffeur.createProAccount': 'Créer mon compte Pro',
    'coiffeur.needPhotoHelp': 'Besoin d\'aide pour vos photos ?',
    'coiffeur.photoHelpDesc': 'Si vous avez des difficultés pour des prises de photos professionnelles, contactez-nous et nous viendrons vous aider gratuitement !',

    // Profile
    'profile.myProfile': 'Mon profil',
    'profile.settings': 'Paramètres',
    'profile.language': 'Langue',
    'profile.notifications': 'Notifications',
    'profile.help': 'Aide',
    'profile.about': 'À propos',

    // Hairstyles
    'hairstyle.tresses': 'Tresses',
    'hairstyle.locks': 'Locks',
    'hairstyle.coupe': 'Coupe',
    'hairstyle.soins': 'Soins',
    'hairstyle.coloration': 'Coloration',
    'hairstyle.tissage': 'Tissage',
    'hairstyle.cornrows': 'Cornrows',
    'hairstyle.afro': 'Afro',

    // Role selection
    'role.chooseSpace': 'Choisissez votre espace',
    'role.clientSpace': 'Espace Client',
    'role.clientSubtitle': 'Trouve ton coiffeur afro et réserve en quelques clics',
    'role.coiffeurSpace': 'Espace Coiffeur',
    'role.coiffeurSubtitle': 'Gère tes rendez-vous et développe ton activité',
    'role.start': 'Commencer',
    'role.access': 'Accéder',
    'role.tagline': 'La coiffure afro, réinventée.',
    'role.trust': 'Déjà +100 coiffeurs nous font confiance.',
    'role.switchRole': 'Changer de parcours',
    'role.switchToClient': 'Passer en mode Client',
    'role.switchToCoiffeur': 'Passer en mode Coiffeur',

    // Onboarding
    'onboarding.slide1Title': 'Des coiffeurs passionnés',
    'onboarding.slide1Subtitle': 'Spécialistes des cheveux afro près de chez toi',
    'onboarding.slide2Title': 'Trouve ton style parfait',
    'onboarding.slide2Subtitle': 'Des centaines de coiffures afro à portée de main',
    'onboarding.slide3Title': 'Réserve en quelques clics',
    'onboarding.slide3Subtitle': 'Simple, rapide et sans stress',
    'onboarding.touchToContinue': 'Touchez l\'écran pour continuer',

    // Geolocation
    'geo.enableLocation': 'Activer la géolocalisation',
    'geo.locationDesc': 'Pour trouver les salons près de chez toi',
    'geo.permissionDenied': 'Permission de localisation refusée',
    'geo.maxDistance': 'Distance maximum',
    'geo.nearbyRadius': 'Rayon de recherche',

    // Checkout & Payment
    'checkout.title': 'Paiement',
    'checkout.secure': 'Sécurisé',
    'checkout.yourBooking': 'Votre réservation',
    'checkout.paymentMethod': 'Moyen de paiement',
    'checkout.creditCard': 'Carte bancaire',
    'checkout.priceDetail': 'Détail du prix',
    'checkout.servicePrice': 'Prix du service',
    'checkout.depositNow': 'Acompte à payer maintenant',
    'checkout.depositInfo': 'Cet acompte confirme votre réservation et sera déduit du prix total. Le reste sera payé directement au salon le jour du rendez-vous.',
    'checkout.remainingAtSalon': 'Reste à payer au salon',
    'checkout.securePayment': 'Paiement sécurisé en 2 étapes',
    'checkout.step1': 'Payez l\'acompte maintenant',
    'checkout.step2': 'Réglez le reste au salon',
    'checkout.payDeposit': 'Payer l\'acompte de',
    'checkout.payFull': 'Payer la totalité',
    'checkout.paymentSuccess': 'Paiement réussi !',
    'checkout.paymentSuccessDesc': 'Votre réservation est confirmée.',
    'checkout.paymentError': 'Erreur de paiement',
    'checkout.paymentErrorDesc': 'Une erreur est survenue. Veuillez réessayer.',
    'checkout.viewBooking': 'Voir ma réservation',
    'checkout.termsNotice': 'Paiement sécurisé par Stripe. En payant, vous acceptez nos conditions d\'utilisation.',
    'checkout.choosePaymentType': 'Choisir le type de paiement',
    'checkout.depositOnly': 'Acompte uniquement',
    'checkout.fullPayment': 'Paiement intégral',
    'checkout.commission': 'Commission AfroPlan',

    // Salon Registration
    'salon.photos': 'Photos du salon',
    'salon.addPhotos': 'Ajoutez jusqu\'à 4 photos de votre salon',
    'salon.info': 'Informations du salon',
    'salon.name': 'Nom du salon',
    'salon.description': 'Description',
    'salon.phone': 'Téléphone',
    'salon.email': 'Email',
    'salon.emailHint': 'L\'email est celui de votre compte et ne peut pas être modifié',
    'salon.location': 'Localisation',
    'salon.address': 'Adresse',
    'salon.city': 'Ville',
    'salon.postalCode': 'Code postal',
    'salon.specialties': 'Spécialités de coiffure afro',
    'salon.selectedSpecialties': 'sélectionnées',
    'salon.save': 'Enregistrer les modifications',
    'salon.saving': 'Enregistrement...',
    'salon.saved': 'Salon enregistré !',
    'salon.savedDesc': 'Les informations de votre salon ont été sauvegardées.',
    'salon.openingHours': 'Horaires d\'ouverture',
    'salon.homeService': 'Service à domicile',
    'salon.homeServiceDesc': 'Proposez-vous un service à domicile ?',
    'salon.homeServiceFee': 'Frais de déplacement',
    'salon.connectLogin': 'Se connecter',
    'salon.createPro': 'Créer un compte Pro',

    // Extensions
    'service.requiresExtensions': 'Mèches nécessaires',
    'service.extensionsIncluded': 'Mèches fournies par le salon',
    'service.extensionsNotIncluded': 'Mèches non fournies',
    'service.extensionsNoteIncluded': 'Mèches incluses : Le coiffeur fournit les mèches.',
    'service.extensionsNoteNotIncluded': 'Mèches non fournies : Vous devez apporter vos propres mèches.',
    'service.manageExtensions': 'Gestion des mèches / extensions',
    'service.extensionsDesc': 'Indique si cette coiffure nécessite des extensions',
    'service.extensionsIncludedDesc': 'Désactivez si la cliente doit apporter ses propres mèches',
  },

  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.search': 'Search',
    'common.seeAll': 'See all',
    'common.seeResults': 'See results',

    'common.errorOccurred': 'An error occurred. Please try again.',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Sign up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginRequired': 'Login required',
    'auth.loginRequiredMessage': 'You must be logged in to make a payment.',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': 'No account?',
    'auth.hasAccount': 'Already have an account?',

    // Home
    'home.welcome': 'Welcome to AfroPlan',
    'home.searchSalon': 'Search my salon / hairstylist',
    'home.searchSubtitle': 'Find the style that suits you',
    'home.promotions': 'Current offers',
    'home.hairstyles': 'Hairstyles',
    'home.nearbyCoiffeurs': 'Nearby hairstylists',
    'home.popularSalons': 'Popular salons',
    'home.tipsAndInspiration': 'Tips & Inspiration',
    'home.areYouCoiffeur': 'Are you a hairstylist?',
    'home.joinAfroPlanPro': 'Join AfroPlan Pro and grow your business',
    'home.discoverPro': 'Discover AfroPlan Pro',

    // Search Flow
    'search.findCoiffeur': 'Easily find your afro hairstylist',
    'search.quickQuestions': 'A few quick questions to suggest the best salons for your needs.',
    'search.chooseStyle': 'Choose your hairstyle',
    'search.whatStyle': 'What style would you like?',
    'search.quickFilter': 'Quick filter',
    'search.optional': 'Optional - Refine your search',
    'search.hairType': 'Hair type',
    'search.whereCoiffeur': 'Where would you like to get your hair done?',
    'search.inSalon': 'In salon',
    'search.atHome': 'At home',
    'search.goToSalon': 'Go to the salon',
    'search.coiffeurComesHome': 'The hairstylist comes to you',
    'search.budgetDistance': 'Budget & Distance',
    'search.maxBudget': 'Maximum budget',
    'search.maxDistance': 'Maximum distance',
    'search.showAllSalons': 'I want to see all salons (ignore filters)',
    'search.paymentInfo': 'You can choose to pay the full amount or a deposit when booking.',
    'search.canGoBack': 'You can go back at any time',
    'search.quickPay': 'Quick pay',

    // Booking
    'booking.book': 'Book',
    'booking.confirmed': 'Confirmed',
    'booking.pending': 'Pending',
    'booking.cancelled': 'Cancelled',
    'booking.completed': 'Completed',
    'booking.yourBookings': 'My bookings',
    'booking.upcoming': 'Upcoming',
    'booking.past': 'Past',

    // Chat
    'chat.writeMessage': 'Write your message...',
    'chat.online': 'Online',
    'chat.reservationConfirmed': 'Booking confirmed! You can now chat.',
    'chat.willBeLate': "I'll be a bit late",
    'chat.onMyWay': "I'm on my way",
    'chat.whatTime': 'What time exactly?',
    'chat.sendAddress': 'Can you send me the address?',

    // Coiffeur Dashboard
    'coiffeur.developActivity': 'Grow your business',
    'coiffeur.joinCommunity': 'Join the AfroPlan Pro community and boost your salon',
    'coiffeur.rdvManagement': 'Booking management',
    'coiffeur.manageReservations': 'Easily manage your bookings',
    'coiffeur.moreClients': 'More clients',
    'coiffeur.increaseVisibility': 'Increase your visibility',
    'coiffeur.statistics': 'Statistics',
    'coiffeur.trackPerformance': 'Track your performance',
    'coiffeur.payments': 'Payments',
    'coiffeur.securePayment': 'Get paid securely',
    'coiffeur.readyToStart': 'Ready to start?',
    'coiffeur.registerFree': 'Sign up for free and start receiving bookings',
    'coiffeur.createProAccount': 'Create my Pro account',
    'coiffeur.needPhotoHelp': 'Need help with your photos?',
    'coiffeur.photoHelpDesc': 'If you have trouble taking professional photos, contact us and we\'ll come help you for free!',

    // Profile
    'profile.myProfile': 'My profile',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.notifications': 'Notifications',
    'profile.help': 'Help',
    'profile.about': 'About',

    // Hairstyles
    'hairstyle.tresses': 'Braids',
    'hairstyle.locks': 'Locks',
    'hairstyle.coupe': 'Cut',
    'hairstyle.soins': 'Care',
    'hairstyle.coloration': 'Coloring',
    'hairstyle.tissage': 'Weave',
    'hairstyle.cornrows': 'Cornrows',
    'hairstyle.afro': 'Afro',

    // Role selection
    'role.chooseSpace': 'Choose your space',
    'role.clientSpace': 'Client Space',
    'role.clientSubtitle': 'Find your afro hairstylist and book in a few clicks',
    'role.coiffeurSpace': 'Hairstylist Space',
    'role.coiffeurSubtitle': 'Manage your appointments and grow your business',
    'role.start': 'Get started',
    'role.access': 'Access',
    'role.tagline': 'Afro hairstyling, reinvented.',
    'role.trust': 'Already 100+ hairstylists trust us.',
    'role.switchRole': 'Switch path',
    'role.switchToClient': 'Switch to Client mode',
    'role.switchToCoiffeur': 'Switch to Hairstylist mode',

    // Onboarding
    'onboarding.slide1Title': 'Passionate hairstylists',
    'onboarding.slide1Subtitle': 'Afro hair specialists near you',
    'onboarding.slide2Title': 'Find your perfect style',
    'onboarding.slide2Subtitle': 'Hundreds of afro hairstyles at your fingertips',
    'onboarding.slide3Title': 'Book in a few clicks',
    'onboarding.slide3Subtitle': 'Simple, fast and stress-free',
    'onboarding.touchToContinue': 'Tap to continue',

    // Geolocation
    'geo.enableLocation': 'Enable location',
    'geo.locationDesc': 'To find salons near you',
    'geo.permissionDenied': 'Location permission denied',
    'geo.maxDistance': 'Maximum distance',
    'geo.nearbyRadius': 'Search radius',

    // Checkout & Payment
    'checkout.title': 'Payment',
    'checkout.secure': 'Secure',
    'checkout.yourBooking': 'Your booking',
    'checkout.paymentMethod': 'Payment method',
    'checkout.creditCard': 'Credit card',
    'checkout.priceDetail': 'Price detail',
    'checkout.servicePrice': 'Service price',
    'checkout.depositNow': 'Deposit to pay now',
    'checkout.depositInfo': 'This deposit confirms your booking and will be deducted from the total price. The rest is paid directly at the salon on appointment day.',
    'checkout.remainingAtSalon': 'Remaining to pay at salon',
    'checkout.securePayment': 'Secure 2-step payment',
    'checkout.step1': 'Pay the deposit now',
    'checkout.step2': 'Pay the rest at the salon',
    'checkout.payDeposit': 'Pay deposit of',
    'checkout.payFull': 'Pay in full',
    'checkout.paymentSuccess': 'Payment successful!',
    'checkout.paymentSuccessDesc': 'Your booking is confirmed.',
    'checkout.paymentError': 'Payment error',
    'checkout.paymentErrorDesc': 'An error occurred. Please try again.',
    'checkout.viewBooking': 'View my booking',
    'checkout.termsNotice': 'Secure payment by Stripe. By paying, you accept our terms of use.',
    'checkout.choosePaymentType': 'Choose payment type',
    'checkout.depositOnly': 'Deposit only',
    'checkout.fullPayment': 'Full payment',
    'checkout.commission': 'AfroPlan commission',

    // Salon Registration
    'salon.photos': 'Salon photos',
    'salon.addPhotos': 'Add up to 4 photos of your salon',
    'salon.info': 'Salon information',
    'salon.name': 'Salon name',
    'salon.description': 'Description',
    'salon.phone': 'Phone',
    'salon.email': 'Email',
    'salon.emailHint': 'Email is from your account and cannot be changed',
    'salon.location': 'Location',
    'salon.address': 'Address',
    'salon.city': 'City',
    'salon.postalCode': 'Postal code',
    'salon.specialties': 'Afro hairstyling specialties',
    'salon.selectedSpecialties': 'selected',
    'salon.save': 'Save changes',
    'salon.saving': 'Saving...',
    'salon.saved': 'Salon saved!',
    'salon.savedDesc': 'Your salon information has been saved.',
    'salon.openingHours': 'Opening hours',
    'salon.homeService': 'Home service',
    'salon.homeServiceDesc': 'Do you offer home service?',
    'salon.homeServiceFee': 'Travel fee',
    'salon.connectLogin': 'Log in',
    'salon.createPro': 'Create Pro account',

    // Extensions
    'service.requiresExtensions': 'Extensions required',
    'service.extensionsIncluded': 'Extensions provided by salon',
    'service.extensionsNotIncluded': 'Extensions not provided',
    'service.extensionsNoteIncluded': 'Extensions included: The hairstylist provides the extensions.',
    'service.extensionsNoteNotIncluded': 'Extensions not included: You must bring your own extensions.',
    'service.manageExtensions': 'Manage extensions',
    'service.extensionsDesc': 'Indicate if this hairstyle requires extensions',
    'service.extensionsIncludedDesc': 'Disable if the client must bring their own extensions',
  },

  de: {
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.next': 'Weiter',
    'common.back': 'Zurück',
    'common.search': 'Suchen',
    'common.seeAll': 'Alle anzeigen',
    'common.seeResults': 'Ergebnisse anzeigen',

    // Auth
    'auth.login': 'Anmelden',
    'auth.register': 'Registrieren',
    'auth.logout': 'Abmelden',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.noAccount': 'Kein Konto?',
    'auth.hasAccount': 'Bereits ein Konto?',

    // Home
    'home.welcome': 'Willkommen bei AfroPlan',
    'home.searchSalon': 'Meinen Salon / Friseur suchen',
    'home.searchSubtitle': 'Finde den Stil, der zu dir passt',
    'home.promotions': 'Aktuelle Angebote',
    'home.hairstyles': 'Frisuren',
    'home.nearbyCoiffeurs': 'Friseure in der Nähe',
    'home.popularSalons': 'Beliebte Salons',
    'home.tipsAndInspiration': 'Tipps & Inspiration',
    'home.areYouCoiffeur': 'Bist du Friseur(in)?',
    'home.joinAfroPlanPro': 'Tritt AfroPlan Pro bei und entwickle dein Geschäft',
    'home.discoverPro': 'AfroPlan Pro entdecken',

    // Search Flow
    'search.findCoiffeur': 'Finde einfach deinen Afro-Friseur',
    'search.quickQuestions': 'Ein paar schnelle Fragen, um dir die besten Salons vorzuschlagen.',
    'search.chooseStyle': 'Wähle deine Frisur',
    'search.whatStyle': 'Welchen Stil möchtest du?',
    'search.quickFilter': 'Schnellfilter',
    'search.optional': 'Optional - Suche verfeinern',
    'search.hairType': 'Haartyp',
    'search.whereCoiffeur': 'Wo möchtest du frisiert werden?',
    'search.inSalon': 'Im Salon',
    'search.atHome': 'Zu Hause',
    'search.goToSalon': 'Zum Salon gehen',
    'search.coiffeurComesHome': 'Der Friseur kommt zu dir',
    'search.budgetDistance': 'Budget & Entfernung',
    'search.maxBudget': 'Maximales Budget',
    'search.maxDistance': 'Maximale Entfernung',
    'search.showAllSalons': 'Ich möchte alle Salons sehen (Filter ignorieren)',
    'search.paymentInfo': 'Du kannst bei der Buchung wählen, ob du den vollen Betrag oder eine Anzahlung bezahlen möchtest.',
    'search.canGoBack': 'Du kannst jederzeit zurückgehen',

    // Booking
    'booking.book': 'Buchen',
    'booking.confirmed': 'Bestätigt',
    'booking.pending': 'Ausstehend',
    'booking.cancelled': 'Storniert',
    'booking.completed': 'Abgeschlossen',
    'booking.yourBookings': 'Meine Buchungen',
    'booking.upcoming': 'Bevorstehend',
    'booking.past': 'Vergangen',

    // Chat
    'chat.writeMessage': 'Schreibe deine Nachricht...',
    'chat.online': 'Online',
    'chat.reservationConfirmed': 'Buchung bestätigt! Ihr könnt jetzt chatten.',
    'chat.willBeLate': 'Ich werde etwas später sein',
    'chat.onMyWay': 'Ich bin unterwegs',
    'chat.whatTime': 'Um wie viel Uhr genau?',
    'chat.sendAddress': 'Kannst du mir die Adresse schicken?',

    // Coiffeur Dashboard
    'coiffeur.developActivity': 'Entwickle dein Geschäft',
    'coiffeur.joinCommunity': 'Tritt der AfroPlan Pro Community bei und steigere deinen Salon',
    'coiffeur.rdvManagement': 'Terminverwaltung',
    'coiffeur.manageReservations': 'Verwalte deine Buchungen einfach',
    'coiffeur.moreClients': 'Mehr Kunden',
    'coiffeur.increaseVisibility': 'Steigere deine Sichtbarkeit',
    'coiffeur.statistics': 'Statistiken',
    'coiffeur.trackPerformance': 'Verfolge deine Leistung',
    'coiffeur.payments': 'Zahlungen',
    'coiffeur.securePayment': 'Sicher bezahlt werden',
    'coiffeur.readyToStart': 'Bereit loszulegen?',
    'coiffeur.registerFree': 'Registriere dich kostenlos und beginne Buchungen zu erhalten',
    'coiffeur.createProAccount': 'Mein Pro-Konto erstellen',
    'coiffeur.needPhotoHelp': 'Brauchst du Hilfe mit deinen Fotos?',
    'coiffeur.photoHelpDesc': 'Wenn du Schwierigkeiten hast, professionelle Fotos zu machen, kontaktiere uns und wir kommen kostenlos helfen!',

    // Profile
    'profile.myProfile': 'Mein Profil',
    'profile.settings': 'Einstellungen',
    'profile.language': 'Sprache',
    'profile.notifications': 'Benachrichtigungen',
    'profile.help': 'Hilfe',
    'profile.about': 'Über',

    // Hairstyles
    'hairstyle.tresses': 'Zöpfe',
    'hairstyle.locks': 'Locks',
    'hairstyle.coupe': 'Schnitt',
    'hairstyle.soins': 'Pflege',
    'hairstyle.coloration': 'Färbung',
    'hairstyle.tissage': 'Weave',
    'hairstyle.cornrows': 'Cornrows',
    'hairstyle.afro': 'Afro',
  },

  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.next': 'Siguiente',
    'common.back': 'Atrás',
    'common.search': 'Buscar',
    'common.seeAll': 'Ver todo',
    'common.seeResults': 'Ver resultados',

    // Auth
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Registrarse',
    'auth.logout': 'Cerrar sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.hasAccount': '¿Ya tienes cuenta?',

    // Home
    'home.welcome': 'Bienvenido a AfroPlan',
    'home.searchSalon': 'Buscar mi salón / estilista',
    'home.searchSubtitle': 'Encuentra el estilo que te queda',
    'home.promotions': 'Ofertas actuales',
    'home.hairstyles': 'Estilos de peinado',
    'home.nearbyCoiffeurs': 'Estilistas cercanos',
    'home.popularSalons': 'Salones populares',
    'home.tipsAndInspiration': 'Consejos e Inspiración',
    'home.areYouCoiffeur': '¿Eres estilista?',
    'home.joinAfroPlanPro': 'Únete a AfroPlan Pro y haz crecer tu negocio',
    'home.discoverPro': 'Descubrir AfroPlan Pro',

    // Search Flow
    'search.findCoiffeur': 'Encuentra fácilmente tu estilista afro',
    'search.quickQuestions': 'Algunas preguntas rápidas para sugerirte los mejores salones.',
    'search.chooseStyle': 'Elige tu peinado',
    'search.whatStyle': '¿Qué estilo te gustaría?',
    'search.quickFilter': 'Filtro rápido',
    'search.optional': 'Opcional - Refina tu búsqueda',
    'search.hairType': 'Tipo de cabello',
    'search.whereCoiffeur': '¿Dónde te gustaría peinarte?',
    'search.inSalon': 'En el salón',
    'search.atHome': 'A domicilio',
    'search.goToSalon': 'Ir al salón',
    'search.coiffeurComesHome': 'El estilista viene a ti',
    'search.budgetDistance': 'Presupuesto y Distancia',
    'search.maxBudget': 'Presupuesto máximo',
    'search.maxDistance': 'Distancia máxima',
    'search.showAllSalons': 'Quiero ver todos los salones (ignorar filtros)',
    'search.paymentInfo': 'Puedes elegir pagar el monto total o un anticipo al reservar.',
    'search.canGoBack': 'Puedes volver atrás en cualquier momento',

    // Booking
    'booking.book': 'Reservar',
    'booking.confirmed': 'Confirmado',
    'booking.pending': 'Pendiente',
    'booking.cancelled': 'Cancelado',
    'booking.completed': 'Completado',
    'booking.yourBookings': 'Mis reservas',
    'booking.upcoming': 'Próximas',
    'booking.past': 'Pasadas',

    // Chat
    'chat.writeMessage': 'Escribe tu mensaje...',
    'chat.online': 'En línea',
    'chat.reservationConfirmed': '¡Reserva confirmada! Ya pueden chatear.',
    'chat.willBeLate': 'Llegaré un poco tarde',
    'chat.onMyWay': 'Estoy en camino',
    'chat.whatTime': '¿A qué hora exactamente?',
    'chat.sendAddress': '¿Puedes enviarme la dirección?',

    // Coiffeur Dashboard
    'coiffeur.developActivity': 'Haz crecer tu negocio',
    'coiffeur.joinCommunity': 'Únete a la comunidad AfroPlan Pro y potencia tu salón',
    'coiffeur.rdvManagement': 'Gestión de citas',
    'coiffeur.manageReservations': 'Gestiona fácilmente tus reservas',
    'coiffeur.moreClients': 'Más clientes',
    'coiffeur.increaseVisibility': 'Aumenta tu visibilidad',
    'coiffeur.statistics': 'Estadísticas',
    'coiffeur.trackPerformance': 'Sigue tu rendimiento',
    'coiffeur.payments': 'Pagos',
    'coiffeur.securePayment': 'Cobra de forma segura',
    'coiffeur.readyToStart': '¿Listo para empezar?',
    'coiffeur.registerFree': 'Regístrate gratis y empieza a recibir reservas',
    'coiffeur.createProAccount': 'Crear mi cuenta Pro',
    'coiffeur.needPhotoHelp': '¿Necesitas ayuda con tus fotos?',
    'coiffeur.photoHelpDesc': 'Si tienes dificultades para tomar fotos profesionales, ¡contáctanos y te ayudaremos gratis!',

    // Profile
    'profile.myProfile': 'Mi perfil',
    'profile.settings': 'Configuración',
    'profile.language': 'Idioma',
    'profile.notifications': 'Notificaciones',
    'profile.help': 'Ayuda',
    'profile.about': 'Acerca de',

    // Hairstyles
    'hairstyle.tresses': 'Trenzas',
    'hairstyle.locks': 'Locks',
    'hairstyle.coupe': 'Corte',
    'hairstyle.soins': 'Tratamientos',
    'hairstyle.coloration': 'Coloración',
    'hairstyle.tissage': 'Tejido',
    'hairstyle.cornrows': 'Cornrows',
    'hairstyle.afro': 'Afro',
  },
};

const LANGUAGE_STORAGE_KEY = '@afroplan_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['fr', 'en', 'de', 'es'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
