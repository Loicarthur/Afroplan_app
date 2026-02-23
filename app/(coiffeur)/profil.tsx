/**
 * Page profil - Espace Coiffeur AfroPlan
 * Refonte Premium - Design épuré et professionnel
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

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
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '10' : colors.primary + '08' }]}>
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
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function CoiffeurProfilScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, signOut, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/onboarding');
            } catch (error) {
              if (__DEV__) console.error('Erreur deconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleSwitchToClient = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'client');
    router.replace('/(tabs)');
  };

  // Contenu pour utilisateur non connecté
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon profil Pro</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour gérer votre activité professionnelle
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── PROFILE HEADER ── */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, '#4A4A4A']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile?.full_name || 'Coiffeur'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {profile?.email || user?.email}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
              <Text style={[styles.roleBadgeText, { color: colors.accent }]}>Compte Vérifié</Text>
            </View>
          </View>
        </View>

        {/* ── QUICK STATS ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>4.9</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Note</Text>
          </View>
          <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>124</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ventes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>3 ans</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exp.</Text>
          </View>
        </View>

        {/* ── MODE SWITCH ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.switchCard, { backgroundColor: '#191919' }]}
            onPress={handleSwitchToClient}
            activeOpacity={0.9}
          >
            <View style={styles.switchIconBg}>
              <Ionicons name="swap-horizontal" size={22} color="#191919" />
            </View>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Passer en Mode Client</Text>
              <Text style={styles.switchSubtitle}>Réserver une prestation Afro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* ── MENU GROUPS ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Gestion Boutique</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem
              icon="storefront-outline"
              title="Mon Salon"
              subtitle="Horaires, photos, adresse"
              onPress={() => router.push('/(coiffeur)/salon')}
            />
            <MenuItem
              icon="cut-outline"
              title="Mes Prestations"
              subtitle="Tarifs et durées"
              onPress={() => router.push('/(coiffeur)/services')}
            />
            <MenuItem
              icon="images-outline"
              title="Portfolio"
              subtitle="Vos plus belles réalisations"
              onPress={() => router.push('/(coiffeur)/portfolio')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Paiements & Revenus</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem
              icon="wallet-outline"
              title="Portefeuille"
              subtitle="Solde et virements"
              onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement')}
            />
            <MenuItem
              icon="receipt-outline"
              title="Historique des gains"
              onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Paramètres</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem
              icon="person-outline"
              title="Informations Personnelles"
              onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement')}
            />
            <MenuItem
              icon="shield-outline"
              title="Confidentialité & Sécurité"
              onPress={() => Alert.alert('Info', 'Fonctionnalité disponible prochainement')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem
              icon="log-out-outline"
              title="Se déconnecter"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>AfroPlan Pro Edition</Text>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>v1.0.0 Stable</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.7,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  
  // Switch Card
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    ...Shadows.md,
  },
  switchIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Menu
  menuGroup: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerVersion: {
    fontSize: 11,
    marginTop: 4,
  },

  // Auth Prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  authMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#191919',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
