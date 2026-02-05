/**
 * Service d'authentification avec Supabase
 * Gere l'inscription, la connexion et la gestion des profils
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, ProfileUpdate } from '@/types/database';

// Verifier si Supabase est configure avant toute operation
const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configure. Veuillez creer un fichier .env avec vos identifiants Supabase. ' +
      'Consultez .env.example pour le format.'
    );
  }
};

// ============================================
// TYPES POUR L'AUTHENTIFICATION
// ============================================

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

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

// ============================================
// FONCTIONS DE VALIDATION
// ============================================

/**
 * Valider une adresse email
 */
const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'L\'email est requis';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'L\'email n\'est pas valide';
  }
  return null;
};

/**
 * Valider un mot de passe
 */
const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  if (password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caracteres';
  }
  if (password.length > 72) {
    return 'Le mot de passe ne peut pas depasser 72 caracteres';
  }
  // Verification de la complexite (optionnel mais recommande)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre';
  }
  return null;
};

/**
 * Valider un nom complet
 */
const validateFullName = (name: string): string | null => {
  if (!name) {
    return 'Le nom complet est requis';
  }
  if (name.length < 2) {
    return 'Le nom doit contenir au moins 2 caracteres';
  }
  if (name.length > 100) {
    return 'Le nom ne peut pas depasser 100 caracteres';
  }
  return null;
};

/**
 * Valider un numero de telephone (optionnel)
 */
const validatePhone = (phone?: string): string | null => {
  if (!phone) return null; // Le telephone est optionnel

  // Nettoyer le numero
  const cleanPhone = phone.replace(/[\s\-\.]/g, '');

  // Format francais ou international
  const phoneRegex = /^(\+33|0033|0)?[1-9][0-9]{8}$/;
  const internationalRegex = /^\+?[1-9]\d{6,14}$/;

  if (!phoneRegex.test(cleanPhone) && !internationalRegex.test(cleanPhone)) {
    return 'Le numero de telephone n\'est pas valide';
  }
  return null;
};

/**
 * Valider tous les parametres d'inscription
 */
const validateSignUpParams = (params: SignUpParams): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(params.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(params.password);
  if (passwordError) errors.password = passwordError;

  const nameError = validateFullName(params.fullName);
  if (nameError) errors.fullName = nameError;

  const phoneError = validatePhone(params.phone);
  if (phoneError) errors.phone = phoneError;

  if (params.role && !['client', 'coiffeur'].includes(params.role)) {
    errors.role = 'Le role doit etre "client" ou "coiffeur"';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp({ email, password, fullName, phone, role = 'client' }: SignUpParams) {
    checkSupabaseConfig();

    // Premiere tentative avec les metadonnees completes
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role,
        },
      },
    });

    if (authError) {
      // Si le trigger handle_new_user() a echoue, retenter sans metadonnees
      // puis creer le profil manuellement
      if (authError.message.toLowerCase().includes('database error')) {
        const { data: retryData, error: retryError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (retryError) {
          throw new Error(retryError.message);
        }

        // Creer le profil manuellement si l'utilisateur a ete cree
        if (retryData.user) {
          await this.ensureProfile(retryData.user.id, {
            email,
            full_name: fullName,
            phone: phone || null,
            role: role as 'client' | 'coiffeur',
          });
        }

        return retryData;
      }

      throw new Error(authError.message);
    }

    // Verifier que le profil a ete cree par le trigger, sinon le creer
    if (authData.user) {
      await this.ensureProfile(authData.user.id, {
        email,
        full_name: fullName,
        phone: phone || null,
        role: role as 'client' | 'coiffeur',
      });
    }

    return authData;
  },

  /**
   * Verifier si le profil existe, sinon le creer (fallback si le trigger echoue)
   */
  async ensureProfile(userId: string, data: {
    email: string;
    full_name: string;
    phone?: string | null;
    role: 'client' | 'coiffeur';
  }): Promise<void> {
    const existing = await this.getProfile(userId);
    if (existing) return;

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
      });

    if (error) {
      console.warn('ensureProfile: echec de creation du profil:', error.message);
    }
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

  // ============================================
  // NOUVELLES METHODES DE VALIDATION
  // ============================================

  /**
   * Valider les parametres d'inscription avant envoi
   */
  validateSignUp(params: SignUpParams): ValidationResult {
    return validateSignUpParams(params);
  },

  /**
   * Valider un email
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const error = validateEmail(email);
    return { isValid: !error, error: error || undefined };
  },

  /**
   * Valider un mot de passe
   */
  validatePassword(password: string): { isValid: boolean; error?: string } {
    const error = validatePassword(password);
    return { isValid: !error, error: error || undefined };
  },

  /**
   * Valider un numero de telephone
   */
  validatePhone(phone?: string): { isValid: boolean; error?: string } {
    const error = validatePhone(phone);
    return { isValid: !error, error: error || undefined };
  },

  // ============================================
  // FONCTIONNALITES SUPPLEMENTAIRES
  // ============================================

  /**
   * Verifier si un email existe deja
   */
  async checkEmailExists(email: string): Promise<boolean> {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return !!data;
  },

  /**
   * Inscription complete avec validation
   */
  async signUpWithValidation(params: SignUpParams) {
    checkSupabaseConfig();

    // Valider les parametres
    const validation = validateSignUpParams(params);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join('. '));
    }

    // Verifier si l'email existe deja
    const emailExists = await this.checkEmailExists(params.email);
    if (emailExists) {
      throw new Error('Cet email est deja utilise');
    }

    // Proceder a l'inscription
    return this.signUp(params);
  },

  /**
   * Connexion avec validation
   */
  async signInWithValidation({ email, password }: SignInParams) {
    checkSupabaseConfig();

    const emailError = validateEmail(email);
    if (emailError) {
      throw new Error(emailError);
    }

    if (!password) {
      throw new Error('Le mot de passe est requis');
    }

    return this.signIn({ email, password });
  },

  /**
   * Obtenir le role de l'utilisateur connecte
   */
  async getCurrentUserRole(): Promise<'client' | 'coiffeur' | 'admin' | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const profile = await this.getProfile(user.id);
    return profile?.role || null;
  },

  /**
   * Verifier si l'utilisateur est un coiffeur
   */
  async isCoiffeur(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'coiffeur';
  },

  /**
   * Verifier si l'utilisateur est un client
   */
  async isClient(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'client';
  },

  /**
   * Verifier si l'utilisateur est admin
   */
  async isAdmin(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  },

  /**
   * Mettre a jour le role de l'utilisateur (admin uniquement)
   */
  async updateUserRole(userId: string, role: 'client' | 'coiffeur' | 'admin'): Promise<Profile> {
    const currentRole = await this.getCurrentUserRole();
    if (currentRole !== 'admin') {
      throw new Error('Seul un administrateur peut modifier les roles');
    }

    return this.updateProfile(userId, { role });
  },

  /**
   * Supprimer le compte utilisateur
   */
  async deleteAccount(): Promise<void> {
    checkSupabaseConfig();
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Aucun utilisateur connecte');
    }

    // La suppression du profil est cascade avec auth.users
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Rafraichir la session
   */
  async refreshSession() {
    checkSupabaseConfig();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  },

  /**
   * Formater un numero de telephone pour l'affichage
   */
  formatPhoneNumber(phone?: string): string {
    if (!phone) return '';

    // Nettoyer le numero
    let cleaned = phone.replace(/\D/g, '');

    // Si le numero commence par 33, ajouter le +
    if (cleaned.startsWith('33')) {
      cleaned = '+' + cleaned;
    }

    // Format francais: +33 6 12 34 56 78
    if (cleaned.startsWith('+33') || cleaned.startsWith('0')) {
      const digits = cleaned.replace(/^\+33/, '0').replace(/^0033/, '0');
      if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
      }
    }

    return phone;
  },
};
