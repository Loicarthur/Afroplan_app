/**
 * Point d'entree pour tous les types de l'application
 */

export * from './database';

// Types pour la navigation
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  '(coiffeur)': undefined;
  '(salon)': undefined;
  'salon/[id]': { id: string };
  'booking/[id]': { id: string };
};

// Types pour l'etat de l'application
export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: import('./database').Profile | null;
};

// Types pour les reponses API
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

// Types pour la pagination
export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};
