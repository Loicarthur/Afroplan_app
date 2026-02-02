/**
 * Page d'inscription AfroPlan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button, Input } from '@/components/ui';

type UserRole = 'client' | 'coiffeur';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caracteres';
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
      await signUp(email, password, fullName, phone || undefined, role);
      Alert.alert(
        'Inscription reussie',
        'Un email de confirmation vous a ete envoye. Veuillez verifier votre boite de reception.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur d\'inscription',
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Creer un compte
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rejoignez la communaute AfroPlan
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSelection}>
            <Text style={[styles.roleLabel, { color: colors.text }]}>
              Je suis un(e):
            </Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  {
                    backgroundColor:
                      role === 'client' ? colors.primary : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setRole('client')}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={role === 'client' ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: role === 'client' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Client
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  {
                    backgroundColor:
                      role === 'coiffeur' ? colors.primary : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setRole('coiffeur')}
              >
                <Ionicons
                  name="cut-outline"
                  size={20}
                  color={role === 'coiffeur' ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: role === 'coiffeur' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Coiffeur
                </Text>
              </TouchableOpacity>
            </View>
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
              label="Telephone (optionnel)"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              leftIcon="call-outline"
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caracteres"
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
              style={{ marginTop: Spacing.md }}
            />
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.textSecondary }]}>
            En vous inscrivant, vous acceptez nos{' '}
            <Text style={{ color: colors.primary }}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={{ color: colors.primary }}>Politique de confidentialite</Text>
          </Text>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Vous avez deja un compte?
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                {' '}Se connecter
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
  },
  roleSelection: {
    marginBottom: Spacing.lg,
  },
  roleLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  roleButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  terms: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
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
});
