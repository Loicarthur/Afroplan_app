/**
 * Dashboard Coiffeur AfroPlan
 * Design basé sur sd.png et sde.png
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, Shadows } from '@/constants/theme';
import LanguageSelector from '@/components/LanguageSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;
const isVerySmallScreen = width < 340;

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

// Composant Benefit Card pour l'écran non-connecté
interface BenefitCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  delay: number;
}

function BenefitCard({ icon, title, description, iconBgColor, iconColor, delay }: BenefitCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      style={[styles.benefitCard, { backgroundColor: colors.card }]}
    >
      <View style={[styles.benefitIcon, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={[styles.benefitTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </Animated.View>
  );
}

export default function CoiffeurDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, isAuthenticated, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const handleSwitchToClient = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'client');
    router.replace('/(tabs)');
  };

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

  // Fonction pour upgrader le rôle client → coiffeur
  const handleBecomeCoiffeur = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'coiffeur' })
        .eq('id', profile?.id);

      if (error) throw error;

      // Rafraîchir le profil dans le contexte pour que isCoiffeur = true
      await refreshProfile();
      router.push('/(coiffeur)/salon');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil. Réessayez.');
      if (__DEV__) console.warn('Erreur upgrade coiffeur:', err);
    }
  };

  // Contenu pour utilisateur non connecté
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header avec logo Afroplan */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              {/* Logo Afroplan */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require('@/assets/images/logo_afroplan.jpeg')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>

              {/* Auth Buttons */}
              <View style={styles.authButtons}>
                <LanguageSelector compact />
                <TouchableOpacity
                  style={styles.switchRoleButton}
                  onPress={handleSwitchToClient}
                >
                  <Ionicons name="swap-horizontal" size={16} color="#191919" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
                >
                  <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
                >
                  <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* AfroPlan Pro Badge */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.proBadgeSection}
          >
            <View style={styles.proBadge}>
              <Ionicons name="trending-up" size={18} color="#7C3AED" />
              <Text style={styles.proBadgeText}>AfroPlan Pro</Text>
            </View>
          </Animated.View>

          {/* Section avantages */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeInUp.delay(250).duration(500)}
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Développez votre activité
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(300).duration(500)}
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
            >
              Rejoignez la communauté AfroPlan Pro et boostez votre salon
            </Animated.Text>

            <View style={styles.benefitsContainer}>
              <BenefitCard
                icon="calendar"
                title="Gestion des RDV"
                description="Gérez facilement vos réservations"
                iconBgColor="#191919"
                iconColor="#FFFFFF"
                delay={350}
              />
              <BenefitCard
                icon="people"
                title="Plus de clients"
                description="Augmentez votre visibilité"
                iconBgColor="#22C55E20"
                iconColor="#22C55E"
                delay={400}
              />
              <BenefitCard
                icon="stats-chart"
                title="Statistiques"
                description="Suivez vos performances"
                iconBgColor="#F59E0B20"
                iconColor="#F59E0B"
                delay={450}
              />
              <BenefitCard
                icon="card"
                title="Paiements"
                description="Encaissez en toute sécurité"
                iconBgColor="#EC489920"
                iconColor="#EC4899"
                delay={500}
              />
            </View>
          </View>

          {/* CTA Section */}
          <Animated.View
            entering={FadeInUp.delay(550).duration(500)}
            style={styles.ctaSection}
          >
            <View style={styles.ctaCard}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="cut" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.ctaTitle}>Prêt à commencer ?</Text>
              <Text style={styles.ctaDesc}>
                Inscrivez-vous gratuitement et commencez à recevoir des réservations
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
              >
                <Ionicons name="sparkles" size={18} color="#191919" />
                <Text style={styles.ctaButtonText}>Créer mon compte Pro</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Photo Help Section */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(500)}
            style={styles.helpSection}
          >
            <View style={styles.helpCard}>
              <Ionicons name="camera" size={24} color="#7C3AED" />
              <View style={styles.helpTextContainer}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>
                  Besoin d&apos;aide pour vos photos ?
                </Text>
                <Text style={[styles.helpDesc, { color: colors.textSecondary }]}>
                  Si vous avez des difficultés pour des prises de photos professionnelles,
                  contactez-nous et nous viendrons vous aider gratuitement !
                </Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Client connecté mais pas encore coiffeur → écran d'accueil avec CTA créer salon
  if (profile?.role !== 'coiffeur') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header avec retour vers espace client */}
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()} {profile?.full_name || ''}
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                Espace Coiffeur
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Section avantages */}
          <View style={styles.section}>
            <Animated.Text
              entering={FadeInUp.delay(200).duration(500)}
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Lancez votre activité
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(250).duration(500)}
              style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
            >
              Créez votre salon en quelques clics et recevez des réservations
            </Animated.Text>

            <View style={styles.benefitsContainer}>
              <BenefitCard
                icon="calendar"
                title="Gestion des RDV"
                description="Gérez facilement vos réservations"
                iconBgColor="#191919"
                iconColor="#FFFFFF"
                delay={300}
              />
              <BenefitCard
                icon="people"
                title="Plus de clients"
                description="Augmentez votre visibilité"
                iconBgColor="#22C55E20"
                iconColor="#22C55E"
                delay={350}
              />
              <BenefitCard
                icon="stats-chart"
                title="Statistiques"
                description="Suivez vos performances"
                iconBgColor="#F59E0B20"
                iconColor="#F59E0B"
                delay={400}
              />
              <BenefitCard
                icon="card"
                title="Paiements"
                description="Encaissez en toute sécurité"
                iconBgColor="#EC489920"
                iconColor="#EC4899"
                delay={450}
              />
            </View>
          </View>

          {/* CTA Créer mon salon */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500)}
            style={styles.ctaSection}
          >
            <View style={styles.ctaCard}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="storefront" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.ctaTitle}>Créer mon salon</Text>
              <Text style={styles.ctaDesc}>
                Configurez votre salon et commencez à recevoir des réservations dès maintenant
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleBecomeCoiffeur}
              >
                <Ionicons name="add-circle-outline" size={18} color="#191919" />
                <Text style={styles.ctaButtonText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard pour coiffeur connecté
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/(coiffeur)/messages' as any)}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
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
              color="#F59E0B"
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
              color="#7C3AED"
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
              <View style={[styles.quickActionIcon, { backgroundColor: '#7C3AED' }]}>
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

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/messages' as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Messages clients
              </Text>
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>2 nouveaux</Text>
              </View>
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
              <Text style={[styles.seeAll, { color: '#7C3AED' }]}>Voir tout</Text>
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
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name="chatbubble" size={16} color="#3B82F6" />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name="chatbubble" size={16} color="#3B82F6" />
            </TouchableOpacity>
            <View style={[styles.appointmentStatus, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#F59E0B' }]}>En attente</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    alignItems: 'center',
    gap: 6,
  },
  switchRoleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
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
  proBadgeSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 10 : 12,
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: isVerySmallScreen ? '100%' : (width - 44) / 2,
    padding: isSmallScreen ? 14 : 18,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  benefitIcon: {
    width: isSmallScreen ? 52 : 60,
    height: isSmallScreen ? 52 : 60,
    borderRadius: isSmallScreen ? 26 : 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 10 : 14,
  },
  benefitTitle: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: isSmallScreen ? 11 : 12,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 15 : 17,
  },
  ctaSection: {
    padding: 16,
    paddingTop: 24,
  },
  ctaCard: {
    backgroundColor: '#191919',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  ctaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
  },
  helpSection: {
    padding: 16,
    paddingTop: 8,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#7C3AED10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  messageBadge: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  messageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
