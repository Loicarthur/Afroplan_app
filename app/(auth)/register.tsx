/**
 * Page d'inscription AfroPlan
 * Design responsive amélioré
 */

import React, { useState, useEffect } from 'react';
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
import { Button, Input } from '@/components/ui';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

const SELECTED_ROLE_KEY = '@afroplan_selected_role';

type UserRole = 'client' | 'coiffeur';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, isLoading } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const newErrors: Record<string, string> = {};

    if (!fullName) {
      newErrors.fullName = 'Le nom complet est requis';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await signUp(email, password, fullName, phone || undefined, selectedRole);
      Alert.alert(
        'Inscription réussie',
        'Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.',
        [{
          text: 'OK',
          onPress: () => router.replace({
            pathname: '/(auth)/login',
            params: { role: selectedRole }
          })
        }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur d\'inscription',
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    }
  };

  const isClient = selectedRole === 'client';
  const roleColor = isClient ? '#191919' : '#191919';
  const roleGradient = isClient
    ? ['#191919', '#4A4A4A']
    : ['#191919', '#4A4A4A'];

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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo_afroplan.jpeg')}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Créer un compte
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
                {isClient ? 'Compte Client' : 'Compte Coiffeur'}
              </Text>
            </LinearGradient>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isClient
                ? 'Rejoignez la communauté AfroPlan'
                : 'Développez votre activité avec AfroPlan Pro'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nom complet"
              placeholder="Jean Dupont"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              leftIcon="person-outline"
              error={errors.fullName}
            />

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
              label="Téléphone (optionnel)"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              leftIcon="call-outline"
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            <Button
              title="S'inscrire"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={[styles.registerButton, { backgroundColor: roleColor }]}
            />
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            En vous inscrivant, vous acceptez nos{' '}
            <Text style={{ color: roleColor }} onPress={() => router.push('/terms')}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={{ color: roleColor }} onPress={() => router.push('/privacy-policy')}>Politique de confidentialité</Text>
          </Text>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Vous avez déjà un compte?
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/(auth)/login',
              params: { role: selectedRole }
            })}>
              <Text style={[styles.loginLink, { color: roleColor }]}>
                {' '}Se connecter
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
    paddingTop: isSmallScreen ? Spacing.sm : Spacing.md,
    paddingBottom: isSmallScreen ? Spacing.sm : Spacing.md,
  },
  logoWrapper: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 35 : 40,
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
    marginBottom: Spacing.xs,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: isSmallScreen ? FontSizes.xs : FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  form: {
    marginTop: isSmallScreen ? Spacing.sm : Spacing.md,
  },
  registerButton: {
    marginTop: Spacing.md,
  },
  terms: {
    fontSize: isSmallScreen ? FontSizes.xs : FontSizes.sm,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 16 : 20,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: FontSizes.md,
  },
  loginLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  switchRole: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  switchRoleText: {
    fontSize: FontSizes.sm,
  },
});
