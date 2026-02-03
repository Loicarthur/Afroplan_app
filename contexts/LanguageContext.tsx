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

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Sign up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
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
    'hairstyle.locks': 'Locs',
    'hairstyle.coupe': 'Cut',
    'hairstyle.soins': 'Care',
    'hairstyle.coloration': 'Coloring',
    'hairstyle.tissage': 'Weave',
    'hairstyle.cornrows': 'Cornrows',
    'hairstyle.afro': 'Afro',
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
