import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables Supabase non configurées!\n' +
    'Pour activer l\'authentification, créez un fichier .env à la racine du projet avec:\n' +
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
}

export { supabase };

// Helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
