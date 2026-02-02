/**
 * Dashboard Coiffeur AfroPlan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

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

  // Stats mock
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
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  // Header avec boutons auth (pour non-connectes ou non-coiffeurs)
  const renderHeader = () => (
    <LinearGradient
      colors={['#F97316', '#EA580C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo_afro.jpeg')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <View>
            <Text style={styles.logoText}>AfroPlan Pro</Text>
            <Text style={styles.logoSubtext}>Espace Coiffeur</Text>
          </View>
        </View>

        {isAuthenticated && profile?.role === 'coiffeur' ? (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
            >
              <Text style={styles.loginButtonText}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
            >
              <Text style={styles.registerButtonText}>Inscription</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isAuthenticated && profile?.role === 'coiffeur' && (
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{profile?.full_name || 'Coiffeur'}</Text>
        </View>
      )}
    </LinearGradient>
  );

  // Contenu pour utilisateur non connecte ou non-coiffeur
  if (!isAuthenticated || profile?.role !== 'coiffeur') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}

          {/* Section avantages */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Developpez votre activite
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Rejoignez la communaute AfroPlan Pro et boostez votre salon
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#F97316' + '20' }]}>
                  <Ionicons name="calendar" size={28} color="#F97316" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Gestion des RDV</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Gerez facilement vos reservations
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#22C55E' + '20' }]}>
                  <Ionicons name="people" size={28} color="#22C55E" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Plus de clients</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Augmentez votre visibilite
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                  <Ionicons name="stats-chart" size={28} color="#8B5CF6" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Statistiques</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Suivez vos performances
                </Text>
              </View>

              <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="card" size={28} color="#3B82F6" />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Paiements</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                  Encaissez en toute securite
                </Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              style={styles.ctaCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cut" size={48} color="#FFFFFF" />
              <Text style={styles.ctaTitle}>Pret a commencer ?</Text>
              <Text style={styles.ctaDesc}>
                Inscrivez-vous gratuitement et commencez a recevoir des reservations
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
              >
                <Text style={styles.ctaButtonText}>Creer mon compte Pro</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // Dashboard pour coiffeur connecte
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="calendar"
              title="Aujourd'hui"
              value={stats.todayBookings}
              color={colors.primary}
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
            <StatCard
              icon="time"
              title="En attente"
              value={stats.pendingBookings}
              color={colors.accent}
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="cash"
              title="Revenus (mois)"
              value={`${stats.totalRevenue} EUR`}
              color={colors.success}
            />
            <StatCard
              icon="people"
              title="Clients"
              value={stats.totalClients}
              color="#9B59B6"
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
              <View style={[styles.quickActionIcon, { backgroundColor: '#F97316' }]}>
                <Ionicons name="storefront" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gerer mon salon
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/services')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EA580C' }]}>
                <Ionicons name="cut" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gerer mes services
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/reservations')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Voir les reservations
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
              <Text style={[styles.seeAll, { color: '#F97316' }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: '#F97316' }]}>10:00</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>1h</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Marie Dupont</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Tresses africaines</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.appointmentStatusText, { color: colors.success }]}>Confirme</Text>
            </View>
          </View>

          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: '#F97316' }]}>14:30</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>45min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Jean Martin</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Coupe homme</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#F97316' + '20' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#F97316' }]}>En attente</Text>
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
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  logoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  registerButtonText: {
    fontWeight: '600',
    color: '#EA580C',
  },
  welcomeSection: {
    marginTop: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    width: (width - 52) / 2,
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
    padding: 20,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
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
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EA580C',
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
    fontSize: 12,
    marginTop: 4,
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
