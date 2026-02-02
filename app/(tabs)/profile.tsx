/**
 * Page de profil utilisateur AfroPlan
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
};

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '20' : colors.backgroundSecondary }]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: danger ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, isAuthenticated, signOut, isLoading } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Erreur lors de la deconnexion:', error);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="person-outline" size={60} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Bienvenue sur AfroPlan
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            Connectez-vous pour acceder a votre profil et gerer vos reservations
          </Text>
          <Button
            title="Se connecter"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
          <Button
            title="Creer un compte"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="camera" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.full_name || 'Utilisateur'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {profile?.email || user?.email}
          </Text>
          {profile?.role === 'coiffeur' && (
            <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="cut" size={14} color="#1A1A1A" />
              <Text style={styles.roleBadgeText}>Coiffeur</Text>
            </View>
          )}
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Compte
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="person-outline"
              title="Modifier le profil"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="lock-closed-outline"
              title="Securite"
              subtitle="Mot de passe, authentification"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Preferences
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="globe-outline"
              title="Langue"
              subtitle="Francais"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="moon-outline"
              title="Theme"
              subtitle={colorScheme === 'dark' ? 'Sombre' : 'Clair'}
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="location-outline"
              title="Localisation"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Support
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="help-circle-outline"
              title="Aide"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="document-text-outline"
              title="Conditions d'utilisation"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Politique de confidentialite"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="log-out-outline"
              title="Se deconnecter"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.textMuted }]}>
            AfroPlan
          </Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            Version 1.0.0
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  profileEmail: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  roleBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  menuSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  menuGroup: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  appName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  appVersion: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
});
