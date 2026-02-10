/**
 * Page de connexion AfroPlan
 * Design responsive amélioré
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button, Input, SuccessModal } from '@/components/ui';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const SELECTED_ROLE_KEY = '@afroplan_selected_role';

type UserRole = 'client' | 'coiffeur';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signIn, isLoading, profile } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [showSuccess, setShowSuccess] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const loadRole = async () => {
      const role = params.role || await AsyncStorage.getItem(SELECTED_ROLE_KEY);
      if (role === 'client' || role === 'coiffeur') {
        setSelectedRole(role);
      }
    };
    loadRole();
  }, [params.role]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await signIn(email, password);
      // Afficher la modale de succès — la redirection se fait via le useEffect sur profile
      setShowSuccess(true);
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    }
  };

  // Rediriger quand le profil se charge (si modale déjà fermée)
  useEffect(() => {
    if (profile?.role && !showSuccess && hasRedirected.current === false && showSuccess === false) {
      // Le profil vient de se charger après la modale — on redirige
    }
  }, [profile]);

  const redirectToApp = () => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    // Utiliser le rôle du profil si dispo, sinon le rôle sélectionné
    const role = profile?.role || selectedRole;
    if (role === 'coiffeur') {
      router.replace('/(coiffeur)');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccess(false);
    redirectToApp();
  };

  const isClient = selectedRole === 'client';
  const roleColor = '#191919';
  const roleGradient: [string, string] = ['#191919', '#4A4A4A'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/role-selection')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header with Role Badge */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo_afroplan.jpeg')}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Connexion
            </Text>

            {/* Role Badge */}
            <LinearGradient
              colors={roleGradient}
              style={styles.roleBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name={isClient ? "person" : "cut"}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.roleBadgeText}>
                {isClient ? 'Espace Client' : 'Espace Coiffeur'}
              </Text>
            </LinearGradient>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connectez-vous pour accéder à votre compte
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
            >
              <Text style={[styles.forgotPasswordText, { color: roleColor }]}>
                Mot de passe oublié?
              </Text>
            </TouchableOpacity>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={[styles.loginButton, { backgroundColor: roleColor }]}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => Alert.alert('Info', 'Connexion Google à venir')}
            >
              <Ionicons name="logo-google" size={20} color={colors.text} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => Alert.alert('Info', 'Connexion Apple à venir')}
            >
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Vous n'avez pas de compte?
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/(auth)/register',
              params: { role: selectedRole }
            })}>
              <Text style={[styles.registerLink, { color: roleColor }]}>
                {' '}S'inscrire
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switch Role */}
          <TouchableOpacity
            style={styles.switchRole}
            onPress={() => router.replace('/role-selection')}
          >
            <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
            <Text style={[styles.switchRoleText, { color: colors.textMuted }]}>
              Changer de profil
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modale de succès */}
      <SuccessModal
        visible={showSuccess}
        title="Connexion réussie"
        message="Bienvenue sur AfroPlan !"
        onDismiss={handleSuccessDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? Spacing.md : Spacing.lg,
    paddingBottom: isSmallScreen ? Spacing.md : Spacing.lg,
  },
  logoWrapper: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: isSmallScreen ? 40 : 50,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: isSmallScreen ? FontSizes.xl : FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: isSmallScreen ? FontSizes.sm : FontSizes.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  form: {
    marginTop: isSmallScreen ? Spacing.md : Spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isSmallScreen ? Spacing.lg : Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? Spacing.sm + 2 : Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  socialButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: isSmallScreen ? Spacing.lg : Spacing.xl,
  },
  registerText: {
    fontSize: FontSizes.md,
  },
  registerLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  switchRole: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  switchRoleText: {
    fontSize: FontSizes.sm,
  },
});
