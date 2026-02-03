/**
 * Dashboard Coiffeur AfroPlan
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  color: string;
  onPress?: () => void;
};

function StatCard({ icon, title, value, color, onPress }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function CoiffeurDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [stats] = useState({
    todayBookings: 3,
    pendingBookings: 5,
    totalRevenue: 450,
    totalClients: 28,
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  // Contenu pour utilisateur non connecté ou non-coiffeur
  if (!isAuthenticated || profile?.role !== 'coiffeur') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('@/assets/images/logo_afroplan.jpeg')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
                >
                  <Text style={styles.registerButtonText}>Inscription</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
                >
                  <Text style={styles.loginButtonText}>Connexion</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section avantages */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Développez votre activité
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Rejoignez la communauté AfroPlan Pro et boostez votre salon
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#19191920' }]}>
                  <Ionicons name="calendar" size={28} color="#191919" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Gestion des RDV</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Gérez facilement vos réservations
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#22C55E20' }]}>
                  <Ionicons name="people" size={28} color="#22C55E" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Plus de clients</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Augmentez votre visibilité
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#4A4A4A20' }]}>
                  <Ionicons name="stats-chart" size={28} color="#4A4A4A" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Statistiques</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Suivez vos performances
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#19191920' }]}>
                  <Ionicons name="card" size={28} color="#191919" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Paiements</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Encaissez en toute sécurité
                </Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <Ionicons name="cut" size={48} color="#FFFFFF" />
              <Text style={styles.ctaTitle}>Prêt à commencer ?</Text>
              <Text style={styles.ctaDesc}>
                Inscrivez-vous gratuitement et commencez à recevoir des réservations
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
              >
                <Text style={styles.ctaButtonText}>Créer mon compte Pro</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>Suivez-nous</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://instagram.com/afroplan')}>
                <Ionicons name="logo-instagram" size={24} color="#191919" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://tiktok.com/@afroplan')}>
                <Ionicons name="logo-tiktok" size={24} color="#191919" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={() => openLink('https://linkedin.com/company/afroplan')}>
                <Ionicons name="logo-linkedin" size={24} color="#191919" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => openLink('mailto:support@afroplan.com')}>
              <Text style={[styles.supportLink, { color: colors.primary }]}>Support</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard pour coiffeur connecté
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.full_name || 'Coiffeur'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="calendar"
              title="Aujourd'hui"
              value={stats.todayBookings}
              color="#191919"
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
            <StatCard
              icon="time"
              title="En attente"
              value={stats.pendingBookings}
              color="#4A4A4A"
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="cash"
              title="Revenus (mois)"
              value={`${stats.totalRevenue} €`}
              color="#22C55E"
            />
            <StatCard
              icon="people"
              title="Clients"
              value={stats.totalClients}
              color="#191919"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/salon')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#191919' }]}>
                <Ionicons name="storefront" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gérer mon salon
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/services')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4A4A4A' }]}>
                <Ionicons name="cut" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gérer mes services
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/reservations')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#22C55E' }]}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Voir les réservations
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Prochains rendez-vous
            </Text>
            <TouchableOpacity onPress={() => router.push('/(coiffeur)/reservations')}>
              <Text style={[styles.seeAll, { color: '#191919' }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: '#191919' }]}>10:00</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>1h</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Marie Dupont</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Tresses africaines</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#22C55E20' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#22C55E' }]}>Confirmé</Text>
            </View>
          </View>

          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: '#191919' }]}>14:30</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>45min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Jean Martin</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Coupe homme</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#19191920' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#191919' }]}>En attente</Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  registerButton: {
    backgroundColor: '#f9f8f8',
    borderWidth: 1.5,
    borderColor: '#191919',
    borderRadius: 20,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: 8,
  },
  registerButtonText: {
    color: '#191919',
    fontWeight: '600',
    fontSize: isSmallScreen ? 12 : 14,
  },
  loginButton: {
    backgroundColor: '#191919',
    borderRadius: 20,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: isSmallScreen ? 12 : 14,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: FontSizes.md,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  ctaSection: {
    padding: 16,
  },
  ctaCard: {
    backgroundColor: '#191919',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  ctaDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  quickActions: {
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  appointmentHour: {
    fontSize: 16,
    fontWeight: '700',
  },
  appointmentDuration: {
    fontSize: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentService: {
    fontSize: 13,
    marginTop: 2,
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
