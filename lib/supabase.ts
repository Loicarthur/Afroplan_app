import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { config, logger } from '@/lib/config';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn(
    'Variables Supabase non configurées!\n' +
    `Environnement: ${config.env}\n` +
    'Pour activer l\'authentification, configurez les fichiers .env avec:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon\n' +
    'Obtenez ces valeurs depuis https://app.supabase.com'
  );
}

// Créer le client Supabase seulement si les variables sont définies
// Sinon, créer un client factice qui ne fera rien
let supabase: SupabaseClient<Database>;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  logger.info(`Supabase initialisé [${config.env}]`);
} else {
  // Client factice pour éviter les crashs en dev sans Supabase
  const dummyUrl = 'https://placeholder.supabase.co';
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxNjU4NzYsImV4cCI6MTkzMTc0MTg3Nn0.placeholder';

  supabase = createClient<Database>(dummyUrl, dummyKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  logger.warn('Supabase en mode factice (pas de config)');
}

export { supabase };

// Helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
