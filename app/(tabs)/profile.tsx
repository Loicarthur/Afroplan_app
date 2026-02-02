/**
 * Page Profil AfroPlan - Design z6/z7
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

// Donnees utilisateur de test
const USER_DATA = {
  name: 'Marie Dupont',
  email: 'marie.dupont@email.com',
  location: 'Paris, France',
  avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
  stats: {
    reservations: 12,
    avis: 8,
    salons: 5,
  },
};

// Reservations recentes de test
const RECENT_BOOKINGS = [
  {
    id: '1',
    salon: 'Bella Coiffure',
    service: 'Box Braids',
    date: '15 Jan 2026',
    status: 'Termine',
    statusColor: '#22C55E',
  },
  {
    id: '2',
    salon: 'Afro Style Studio',
    service: 'Twists',
    date: '22 Dec 2025',
    status: 'Termine',
    statusColor: '#22C55E',
  },
];

// Menu items
const MENU_ITEMS = [
  { id: 'edit', icon: 'person-outline', label: 'Modifier le profil', color: '#8B5CF6' },
  { id: 'addresses', icon: 'location-outline', label: 'Adresses sauvegardees', color: '#F97316' },
  { id: 'bookings', icon: 'calendar-outline', label: 'Mes reservations', color: '#3B82F6' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', color: '#EC4899' },
  { id: 'settings', icon: 'settings-outline', label: 'Parametres', color: '#8B5CF6' },
  { id: 'help', icon: 'help-circle-outline', label: 'Aide & Support', color: '#6B7280' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signOut, isAuthenticated } = useAuth();

  const handleMenuPress = (itemId: string) => {
    Alert.alert('Info', 'Fonctionnalite a venir');
  };

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

  const handleSeeAllBookings = () => {
    Alert.alert('Info', 'Fonctionnalite a venir');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: USER_DATA.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <Text style={styles.userName}>{USER_DATA.name}</Text>
            <Text style={styles.userEmail}>{USER_DATA.email}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{USER_DATA.location}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{USER_DATA.stats.reservations}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={18} color="#F97316" />
              </View>
              <Text style={styles.statValue}>{USER_DATA.stats.avis}</Text>
              <Text style={styles.statLabel}>Avis donnes</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={18} color="#EC4899" />
              </View>
              <Text style={styles.statValue}>{USER_DATA.stats.salons}</Text>
              <Text style={styles.statLabel}>Salons suivis</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Recent Bookings */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reservations Recentes
            </Text>
            <TouchableOpacity onPress={handleSeeAllBookings}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {RECENT_BOOKINGS.map((booking) => (
            <View
              key={booking.id}
              style={[styles.bookingCard, { backgroundColor: colors.card }, Shadows.sm]}
            >
              <View style={styles.bookingContent}>
                <Text style={[styles.bookingSalon, { color: colors.text }]}>
                  {booking.salon}
                </Text>
                <Text style={[styles.bookingService, { color: colors.textSecondary }]}>
                  {booking.service}
                </Text>
                <View style={styles.bookingDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.bookingDate, { color: colors.textMuted }]}>
                    {booking.date}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: booking.statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: booking.statusColor }]}>
                  {booking.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.signOutButton, { borderColor: colors.border }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Se deconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>
            © 2026 AfroPlan. Tous droits reserves.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingContent: {
    flex: 1,
  },
  bookingSalon: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookingService: {
    fontSize: 13,
    marginBottom: 4,
  },
  bookingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 11,
    marginTop: 4,
  },
});
