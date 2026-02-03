/**
 * Service d'authentification avec Supabase
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, ProfileUpdate } from '@/types/database';

// Vérifier si Supabase est configuré avant toute opération
const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configuré. Veuillez créer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

export type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'client' | 'coiffeur';
};

export type SignInParams = {
  email: string;
  password: string;
};

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp({ email, password, fullName, phone, role = 'client' }: SignUpParams) {
    checkSupabaseConfig();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    return authData;
  },

  /**
   * Connexion d'un utilisateur existant
   */
  async signIn({ email, password }: SignInParams) {
    checkSupabaseConfig();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Deconnexion
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Recuperer la session actuelle
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  },

  /**
   * Recuperer l'utilisateur actuel
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return user;
  },

  /**
   * Recuperer le profil de l'utilisateur
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Mettre a jour le profil
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Reinitialiser le mot de passe
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Mettre a jour le mot de passe
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Uploader une photo de profil
   */
  async uploadAvatar(userId: string, file: { uri: string; type: string; name: string }) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, formData, {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    await this.updateProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
  },

  /**
   * Ecouter les changements d'etat d'authentification
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
