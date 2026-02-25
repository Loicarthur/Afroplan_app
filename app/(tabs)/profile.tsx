/**
 * Page Profil Client - AfroPlan
 * Design épuré inspiré de l'espace coiffeur
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { clientService } from '@/services/client.service';
import { BookingWithDetails } from '@/types';
import NotificationModal from '@/components/NotificationModal';

/* ---------- STATUS CONFIG ---------- */
const STATUS_CONFIG = {
  completed: { label: 'Terminé', color: '#22C55E', icon: 'checkmark-circle' as const },
  pending: { label: 'En attente', color: '#F59E0B', icon: 'time' as const },
  confirmed: { label: 'Confirmé', color: '#3B82F6', icon: 'checkmark-circle' as const },
  cancelled: { label: 'Annulé', color: '#EF4444', icon: 'close-circle' as const },
};

/* ---------- MENU ITEM COMPONENT ---------- */
type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
  badge?: number;
};

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false, badge }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '15' : colors.backgroundSecondary }]}>
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
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

/* ---------- MAIN SCREEN ---------- */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, signOut, isAuthenticated } = useAuth();

  const [stats, setStats] = React.useState<any>(null);
  const [recentBookings, setRecentBookings] = React.useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notificationModalVisible, setNotificationModalVisible] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [statsData, bookingsData] = await Promise.all([
          clientService.getClientStats(user.id),
          clientService.getBookingHistory(user.id, 1)
        ]);
        setStats(statsData);
        setRecentBookings(bookingsData.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [user?.id, isAuthenticated]);

  // Si pas connecté → écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon profil</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour gérer votre profil, vos rendez-vous et vos messages
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.authLink, { color: colors.primary }]}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            } catch (error) {
              if (__DEV__) console.error('Erreur déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleSwitchToCoiffeur = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'coiffeur');
    router.replace('/(coiffeur)');
  };

  const displayName = profile?.full_name || 'Utilisateur';
  const displayEmail = profile?.email || user?.email || '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── PROFILE HEADER ── */}
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
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.card }]}
              onPress={() => Alert.alert('Info', 'Modification de la photo à venir')}
            >
              <Ionicons name="camera" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {displayEmail}
          </Text>
        </View>

        {/* ── STATS SECTION ── */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.totalBookings || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>RDV</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.visitedSalonsCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Salons</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.totalSpent || 0}€</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dépensé</Text>
          </View>
        </View>

        {/* ── SWITCH MODE COIFFEUR (style CityGo) ── */}
        <View style={styles.switchSection}>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSwitchToCoiffeur}
            activeOpacity={0.7}
          >
            <Ionicons name="cut-outline" size={24} color={colors.primary} />
            <View style={styles.switchContent}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                Mode Coiffeur
              </Text>
              <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                Basculer vers l&apos;espace coiffeur
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── RENDEZ-VOUS RÉCENTS ── */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
              Mes rendez-vous récents
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reservations')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuGroup, Shadows.sm]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
            ) : recentBookings.length > 0 ? (
              recentBookings.map(booking => {
                const status = (STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.bookingCard, { backgroundColor: colors.card }]}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/chat/[bookingId]',
                      params: { bookingId: booking.id },
                    })}
                  >
                    <View style={[styles.bookingIconContainer, { backgroundColor: status.color + '15' }]}>
                      <Ionicons name={status.icon} size={22} color={status.color} />
                    </View>
                    <View style={styles.bookingContent}>
                      <Text style={[styles.bookingSalon, { color: colors.text }]}>{booking.salon?.name || 'Salon'}</Text>
                      <Text style={[styles.bookingService, { color: colors.textSecondary }]}>
                        {booking.service?.name || 'Service'} · {booking.booking_date}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted }}>Aucun rendez-vous récent</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── MESSAGES & ALERTES ── */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Messages & Alertes
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="chatbubbles-outline"
              title="Mes conversations"
              subtitle="Échanges avec vos coiffeurs"
              onPress={() => router.push('/(tabs)/reservations')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Historique de vos alertes"
              onPress={() => setNotificationModalVisible(true)}
            />
          </View>
        </View>

        {/* ── COMPTE ── */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            Compte
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="person-outline"
              title="Modifier le profil"
              subtitle="Nom, photo, informations"
              onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
            />
            <MenuItem
              icon="settings-outline"
              title="Paramètres"
              subtitle="Langue, sécurité"
              onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Aide & Support"
              onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
            />
          </View>
        </View>

        {/* ── DÉCONNEXION ── */}
        <View style={styles.menuSection}>
          <View style={[styles.menuGroup, Shadows.sm]}>
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
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.textMuted }]}>AfroPlan</Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <NotificationModal 
        visible={notificationModalVisible} 
        onClose={() => setNotificationModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Profile Header */
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

  /* Stats Section */
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  /* Switch Button */
  switchSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  switchContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  switchTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  /* Menu Sections */
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
    borderBottomColor: 'rgba(0,0,0,0.08)',
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

  /* Badge */
  badge: {
    backgroundColor: '#EF4444',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Booking Cards */
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  bookingIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  bookingSalon: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  bookingService: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Footer */
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

  /* Auth Prompt */
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  authMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  authButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  authLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
