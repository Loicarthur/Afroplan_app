/**
 * Point d'entree pour tous les hooks personnalises
 */

// Hooks existants
export { useColorScheme } from './use-color-scheme';
export { useThemeColor } from './use-theme-color';

// Nouveaux hooks pour Supabase
export * from './use-salons';
export * from './use-bookings';
export * from './use-favorites';
