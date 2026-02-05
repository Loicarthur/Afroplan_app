/**
 * Contexte d'authentification pour l'application AfroPlan
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services';
import { Profile } from '@/types';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: 'client' | 'coiffeur') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session && !!user;

  // Charger le profil utilisateur (avec fallback creation si le trigger a echoue)
  const loadProfile = async (userId: string) => {
    try {
      let userProfile = await authService.getProfile(userId);

      // Fallback: si le profil n'existe pas (trigger echoue), le creer
      if (!userProfile && user?.email) {
        const metadata = user.user_metadata || {};
        await authService.ensureProfile(userId, {
          email: user.email,
          full_name: metadata.full_name || '',
          phone: metadata.phone || null,
          role: metadata.role || 'client',
        });
        userProfile = await authService.getProfile(userId);
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  // Rafraichir le profil
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  // Initialiser la session au demarrage
  useEffect(() => {
    // Ne pas tenter de connexion si Supabase n'est pas configure
    if (!isSupabaseConfigured()) {
      console.warn(
        'Supabase non configure - mode hors ligne. ' +
        'Creez un fichier .env avec vos identifiants Supabase (voir .env.example).'
      );
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Ecouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await loadProfile(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Inscription
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: 'client' | 'coiffeur' = 'client'
  ) => {
    setIsLoading(true);
    try {
      await authService.signUp({ email, password, fullName, phone, role });
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: authUser } = await authService.signIn({ email, password });
      if (authUser) {
        await loadProfile(authUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Deconnexion
  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre a jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecte');
    }

    const updatedProfile = await authService.updateProfile(user.id, updates);
    setProfile(updatedProfile);
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}
