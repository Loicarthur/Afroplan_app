/**
 * Configuration centralisée par environnement - AfroPlan
 *
 * Trois environnements :
 *   - development : dev local, logs verbeux, données fictives autorisées
 *   - preview     : build de test interne (EAS preview), logs limités
 *   - production  : build store, aucun log, analytics activées
 *
 * L'environnement est déterminé automatiquement via les variables Expo
 * et peut être forcé via EXPO_PUBLIC_APP_ENV.
 */

import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppEnvironment = 'development' | 'preview' | 'production';

export interface AppConfig {
  /** Environnement courant */
  env: AppEnvironment;

  /** true si on est en dev local */
  isDev: boolean;
  /** true si on est en preview (build interne) */
  isPreview: boolean;
  /** true si on est en build production (store) */
  isProd: boolean;

  /** Afficher les logs de debug */
  enableDebugLogs: boolean;
  /** Afficher les logs réseau / API */
  enableNetworkLogs: boolean;
  /** Utiliser des données fictives quand le backend n'est pas dispo */
  enableMockData: boolean;
  /** Afficher la bannière d'environnement dans l'UI */
  showEnvBanner: boolean;

  /** Config Supabase */
  supabase: {
    url: string;
    anonKey: string;
  };

  /** Config Stripe */
  stripe: {
    publishableKey: string;
  };

  /** Config API */
  api: {
    /** Timeout des requêtes en ms */
    timeout: number;
    /** Nombre de tentatives en cas d'échec réseau */
    retryCount: number;
  };
}

// ---------------------------------------------------------------------------
// Détection de l'environnement
// ---------------------------------------------------------------------------

function detectEnvironment(): AppEnvironment {
  // 1. Variable explicite (prioritaire)
  const explicit = process.env.EXPO_PUBLIC_APP_ENV as AppEnvironment | undefined;
  if (explicit && ['development', 'preview', 'production'].includes(explicit)) {
    return explicit;
  }

  // 2. Détection via le profil EAS Build
  const easProfile = Constants.expoConfig?.extra?.eas?.buildProfile as string | undefined;
  if (easProfile === 'production') return 'production';
  if (easProfile === 'preview') return 'preview';

  // 3. Channel EAS Update
  const updateChannel = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.expoClient as string | undefined;
  if (updateChannel === 'production') return 'production';
  if (updateChannel === 'preview') return 'preview';

  // 4. __DEV__ flag de React Native
  if (__DEV__) return 'development';

  // 5. Fallback : production par sécurité
  return 'production';
}

// ---------------------------------------------------------------------------
// Construction de la config
// ---------------------------------------------------------------------------

function buildConfig(): AppConfig {
  const env = detectEnvironment();

  const isDev = env === 'development';
  const isPreview = env === 'preview';
  const isProd = env === 'production';

  // Variables d'environnement (EXPO_PUBLIC_* sont exposées côté client)
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

  return {
    env,
    isDev,
    isPreview,
    isProd,

    // Logs & Debug
    enableDebugLogs: isDev,
    enableNetworkLogs: isDev || isPreview,
    enableMockData: isDev,
    showEnvBanner: !isProd,

    // Supabase
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },

    // Stripe
    stripe: {
      publishableKey: stripePublishableKey,
    },

    // API
    api: {
      timeout: isProd ? 15_000 : 30_000,
      retryCount: isProd ? 3 : 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton exporté
// ---------------------------------------------------------------------------

/** Configuration globale de l'app, calculée une seule fois au démarrage. */
export const config: AppConfig = buildConfig();

// ---------------------------------------------------------------------------
// Logger conditionnel
// ---------------------------------------------------------------------------

/**
 * Logger qui respecte l'environnement :
 * - development : tout est affiché
 * - preview     : warn + error uniquement
 * - production  : rien (silencieux)
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (config.enableDebugLogs) console.log('[DEBUG]', ...args);
  },
  info: (...args: unknown[]) => {
    if (config.enableDebugLogs) console.info('[INFO]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (!config.isProd) console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    // Toujours loguer les erreurs, même en prod (pour crashlytics / Sentry)
    console.error('[ERROR]', ...args);
  },
  network: (...args: unknown[]) => {
    if (config.enableNetworkLogs) console.log('[NET]', ...args);
  },
};
