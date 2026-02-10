/**
 * Hook useAuthGuard - Protège les actions qui nécessitent une connexion
 * Retourne { requireAuth, showModal, setShowModal }
 * requireAuth(callback) exécute le callback si connecté, sinon affiche la modale
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        setShowAuthModal(true);
      }
    },
    [isAuthenticated]
  );

  return {
    requireAuth,
    showAuthModal,
    setShowAuthModal,
    isAuthenticated,
  };
}
