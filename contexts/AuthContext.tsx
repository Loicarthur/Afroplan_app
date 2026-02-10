/**
 * Contexte d'authentification pour l'application AfroPlan
 * Gère session, profil, rôles (client/coiffeur/admin) et memoization
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services';
import { Profile } from '@/types';

type UserRole = 'client' | 'coiffeur' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoiffeur: boolean;
  isClient: boolean;
  role: UserRole | null;
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

  // Charger le profil utilisateur
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await authService.getProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      if (__DEV__) console.error('Erreur chargement profil:', error);
    }
  }, []);

  // Rafraichir le profil
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  // Initialiser la session au demarrage
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      if (__DEV__) {
        console.warn(
          'Supabase non configure - mode hors ligne. ' +
          'Creez un fichier .env avec vos identifiants Supabase (voir .env.example).'
        );
      }
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
        if (__DEV__) console.error('Erreur init session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

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
  }, [loadProfile]);

  // Inscription
  const signUp = useCallback(async (
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
  }, []);

  // Connexion
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: authUser } = await authService.signIn({ email, password });
      if (authUser) {
        await loadProfile(authUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  // Deconnexion
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre a jour le profil
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecte');
    }
    const updatedProfile = await authService.updateProfile(user.id, updates);
    setProfile(updatedProfile);
  }, [user?.id]);

  // Memoize le value pour éviter les re-renders en cascade sur tout l'arbre
  const value = useMemo<AuthContextType>(() => {
    const isAuthenticated = !!session && !!user;
    const role = (profile?.role as UserRole) ?? null;

    return {
      session,
      user,
      profile,
      isLoading,
      isAuthenticated,
      isAdmin: role === 'admin',
      isCoiffeur: role === 'coiffeur',
      isClient: role === 'client',
      role,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    };
  }, [session, user, profile, isLoading, signUp, signIn, signOut, updateProfile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}
