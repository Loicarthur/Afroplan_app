/**
 * Dashboard Coiffeur AfroPlan
 * Design basé sur sd.png et sde.png
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState, useEffect } from 'react';
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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, Shadows, BorderRadius } from '@/constants/theme';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationModal from '@/components/NotificationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { salonService } from '@/services/salon.service';
import { bookingService } from '@/services/booking.service';
import { SalonWithDetails, BookingWithDetails, Service } from '@/types';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

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

// Composant étape onboarding
function OnboardingStep({ 
  icon, 
  title, 
  description, 
  isCompleted, 
  onPress, 
  colors 
}: { 
  icon: any, 
  title: string, 
  description: string, 
  isCompleted: boolean, 
  onPress: () => void, 
  colors: any 
}) {
  return (
    <TouchableOpacity 
      style={[styles.onboardingStep, { backgroundColor: colors.card, borderColor: isCompleted ? colors.success : colors.border }]}
      onPress={onPress}
      disabled={isCompleted}
    >
      <View style={[styles.stepIcon, { backgroundColor: isCompleted ? colors.success + '20' : colors.backgroundSecondary }]}>
        <Ionicons name={isCompleted ? "checkmark" : icon} size={20} color={isCompleted ? colors.success : colors.textSecondary} />
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {!isCompleted && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
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
  const { profile, isAuthenticated, refreshProfile, user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [salon, setSalon] = useState<SalonWithDetails | null>(null);
  const [loadingSalon, setLoadingSalon] = useState(true);
  const [todayBookings, setTodayBookings] = useState<BookingWithDetails[]>([]);
  
  // États pour le modal de réservation manuelle
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  // États pour nouveau service à la volée
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');
  const [customServiceDuration, setCustomServiceDuration] = useState('');
  const [selectedServicesList, setSelectedServicesList] = useState<any[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const addServiceToBooking = (name: string, price: string, duration: string) => {
    const newList = [...selectedServicesList, { name, price, duration }];
    setSelectedServicesList(newList);
    
    // Calculer les totaux
    const totalName = newList.map(s => s.name).join(' + ');
    const totalPrice = newList.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const totalDuration = newList.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);

    setCustomServiceName(totalName);
    setCustomServicePrice(totalPrice.toString());
    setCustomServiceDuration(totalDuration.toString());
    setIsCustomService(true);
  };

  const removeServiceFromBooking = (index: number) => {
    const newList = selectedServicesList.filter((_, i) => i !== index);
    setSelectedServicesList(newList);
    
    if (newList.length === 0) {
      setCustomServiceName('');
      setCustomServicePrice('');
      setCustomServiceDuration('');
    } else {
      setCustomServiceName(newList.map(s => s.name).join(' + '));
      setCustomServicePrice(newList.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0).toString());
      setCustomServiceDuration(newList.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0).toString());
    }
  };

  // Calcul de la progression
  const steps = [
    { id: 'services', title: 'Définir mes services', desc: 'Ajoutez vos prestations et tarifs', completed: (salon?.services?.length || 0) > 0, route: '/(coiffeur)/services' },
    { id: 'location', title: 'Ajouter ma localisation', desc: 'Adresse ou zone de déplacement', completed: !!salon?.address && !!salon?.city, route: '/(coiffeur)/salon' },
    { id: 'availability', title: 'Mes disponibilités', desc: 'Définissez quand vous travaillez', completed: !!salon?.opening_hours, route: '/(coiffeur)/salon' },
  ];
  const completedCount = steps.filter(s => s.completed).length;
  const progress = completedCount / steps.length;
  const showOnboarding = completedCount < steps.length;

  const [allTimeStats, setAllTimeStats] = useState<any>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // 1. Charger le salon
      const salonData = await salonService.getSalonByOwnerId(user.id);
      
      if (salonData) {
        const fullSalon = await salonService.getSalonById(salonData.id);
        setSalon(fullSalon);

        // 2. Charger les réservations du jour
        const todayStr = new Date().toLocaleDateString('en-CA');
        const bookingsData = await bookingService.getSalonBookings(salonData.id, undefined, todayStr);
        setTodayBookings(bookingsData.data);

        // 3. Charger les statistiques globales
        const statsData = await salonService.getSalonStats(salonData.id);
        setAllTimeStats(statsData);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoadingSalon(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && profile?.role === 'coiffeur') {
        fetchDashboardData();
      }
    }, [isAuthenticated, profile?.role])
  );

  const handleManualBooking = async () => {
    if (!salon || !manualClientName.trim() || !selectedSlotTime) {
      Alert.alert('Erreur', 'Veuillez remplir le nom du client et l\'heure.');
      return;
    }

    // 1. Vérification des horaires d'ouverture
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = days[new Date().getDay()];
    const schedule = salon.opening_hours ? (salon.opening_hours as any)[todayName] : null;

    if (schedule) {
      const isClosed = schedule.active === false || schedule.closed === true;
      if (isClosed) {
        Alert.alert('Salon fermé', `Votre salon est configuré comme fermé le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}.`);
        return;
      }
      
      const openTime = schedule.start || schedule.open;
      const closeTime = schedule.end || schedule.close;

      // Comparaison simple des chaînes "HH:mm"
      if (selectedSlotTime < openTime || selectedSlotTime > closeTime) {
        Alert.alert(
          'Hors horaires', 
          `L'heure choisie (${selectedSlotTime}) est en dehors de vos horaires d'ouverture (${openTime} - ${closeTime}).`
        );
        return;
      }
    }

    // Validation selon le type de service
    if (isCustomService) {
      if (!customServiceName.trim() || !customServicePrice || !customServiceDuration) {
        Alert.alert('Erreur', 'Veuillez remplir les détails du nouveau service.');
        return;
      }
    } else if (!selectedService) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service.');
      return;
    }

    setIsSavingBooking(true);
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      let serviceToUse = selectedService;

      // 1. Si c'est un service personnalisé, on le crée d'abord
      if (isCustomService) {
        serviceToUse = await salonService.createService({
          salon_id: salon.id,
          name: customServiceName.trim(),
          price: parseFloat(customServicePrice),
          duration_minutes: parseInt(customServiceDuration, 10),
          category: 'Sur mesure',
          is_active: true,
        });
      }

      if (!serviceToUse) throw new Error('Service introuvable');

      // 2. Calculer l'heure de fin
      const [h, m] = selectedSlotTime.split(':').map(Number);
      const endTotalMinutes = h * 60 + m + serviceToUse.duration_minutes;
      const endH = Math.floor(endTotalMinutes / 60);
      const endM = endTotalMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
      const startTime = `${selectedSlotTime}:00`;

      await bookingService.createBooking({
        salon_id: salon.id,
        service_id: serviceToUse.id,
        client_id: user!.id,
        booking_date: todayStr,
        start_time: startTime,
        end_time: endTime,
        total_price: serviceToUse.price,
        status: 'confirmed',
        source: 'coiffeur_walkin',
        notes: `Client: ${manualClientName}`,
      } as any);

      Alert.alert('Succès', 'Rendez-vous ajouté à votre agenda.');
      setBookingModalVisible(false);
      setManualClientName('');
      setSelectedService(null);
      setIsCustomService(false);
      setCustomServiceName('');
      setCustomServicePrice('');
      setCustomServiceDuration('');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le rendez-vous.');
    } finally {
      setIsSavingBooking(false);
    }
  };

  const handleSwitchToClient = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'client');
    router.replace('/(tabs)');
  };

  const pendingBookingsCount = todayBookings.filter(b => b.status === 'pending').length;
  const confirmedTodayCount = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;

  const stats = {
    todayBookings: confirmedTodayCount,
    pendingBookings: pendingBookingsCount,
    totalRevenue: todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + b.total_price, 0),
    totalClients: [...new Set(todayBookings.filter(b => b.status !== 'cancelled').map(b => b.client_id))].length,
    allTimeRevenue: allTimeStats?.totalRevenue || 0,
    weeklyRevenue: allTimeStats?.weeklyRevenue || 0,
    weeklyBookingsCount: allTimeStats?.weeklyBookingsCount || 0,
    allTimeCompleted: allTimeStats?.completedBookings || 0,
    averageRating: allTimeStats?.averageRating || 0,
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().then(() => setRefreshing(false));
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
        .update({ role: 'coiffeur' as const })
        .eq('id', profile?.id ?? '');

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
              {pendingBookingsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{pendingBookingsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Performance Widget */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)}
          style={[styles.businessCard, { backgroundColor: '#191919' }]}
        >
          <View style={styles.businessHeader}>
            <View>
              <Text style={styles.businessLabel}>Revenus de la semaine</Text>
              <Text style={styles.businessValue}>{stats.weeklyRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color="#22C55E" />
              <Text style={styles.growthText}>En hausse</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: stats.allTimeRevenue > 0 ? '100%' : '5%', backgroundColor: '#7C3AED' }]} />
            </View>
            <Text style={styles.progressLabel}>Performance basée sur vos réservations terminées</Text>
          </View>

          <View style={styles.businessFooter}>
            <View style={styles.footerStat}>
              <Text style={styles.footerStatValue}>{stats.weeklyBookingsCount}</Text>
              <Text style={styles.footerStatLabel}>RDV cette sem.</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStat}>
              <Text style={styles.footerStatValue}>{todayBookings.length}</Text>
              <Text style={styles.footerStatLabel}>Aujourd&apos;hui</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerStat}>
              <Text style={styles.footerStatValue}>{stats.averageRating.toFixed(1)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="star" size={10} color="#F59E0B" />
                <Text style={styles.footerStatLabel}>Note</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Smart Onboarding - Affiché si le profil n'est pas complet */}
        {showOnboarding && (
          <View style={styles.section}>
            <View style={[styles.onboardingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.onboardingHeader}>
                <View>
                  <Text style={[styles.onboardingTitle, { color: colors.text }]}>Configuration du salon</Text>
                  <Text style={[styles.onboardingSubtitle, { color: colors.textSecondary }]}>Complétez votre profil pour être visible</Text>
                </View>
                <View style={styles.progressRing}>
                  <Text style={[styles.progressText, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
                </View>
              </View>
              
              <View style={styles.stepsContainer}>
                {steps.map((step, index) => (
                  <OnboardingStep
                    key={step.id}
                    icon={step.id === 'services' ? 'cut' : step.id === 'location' ? 'location' : 'time'}
                    title={step.title}
                    description={step.desc}
                    isCompleted={step.completed}
                    onPress={() => router.push(step.route as any)}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Stats classiques (cachées si onboarding pour éviter de surcharger) */}
        {!showOnboarding && (
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
        )}

                      {/* Quick Actions */}
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Ma Visibilité
                          </Text>
                        </View>
                        <View style={styles.marketingGrid}>
                          <TouchableOpacity
                            style={[styles.marketingCard, { backgroundColor: '#191919' }]}
                            onPress={() => {
                              if (salon) {
                                router.push(`/salon/${salon.id}`);
                              } else {
                                Alert.alert('Presque fini !', 'Configurez votre salon pour voir l\'aperçu.');
                              }
                            }}
                          >
                            <Ionicons name="eye-outline" size={24} color="#FFFFFF" />
                            <Text style={styles.marketingCardText}>Aperçu public</Text>
                          </TouchableOpacity>
              
                          <TouchableOpacity
                            style={[styles.marketingCard, { backgroundColor: '#7C3AED' }]}
                            onPress={() => Alert.alert('Kit Marketing', 'Génération de votre QR Code et lien de partage...')}
                          >
                            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                            <Text style={styles.marketingCardText}>Partager mon salon</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
              
                      {/* Gestion Section */}
                      <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                          Gestion
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
                            onPress={() => router.push('/(coiffeur)/portfolio' as any)}
                          >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#EC4899' }]}>
                              <Ionicons name="images" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.quickActionText, { color: colors.text }]}>
                              Portfolio (Réalisations)
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
                            {pendingBookingsCount > 0 && (
                              <View style={styles.messageBadge}>
                                <Text style={styles.messageBadgeText}>{pendingBookingsCount} nouveau{pendingBookingsCount > 1 ? 'x' : ''}</Text>
                              </View>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
        {/* Timeline Journalière (Agenda) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Mon Agenda
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Aujourd&apos;hui, {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(coiffeur)/reservations')}>
              <Text style={[styles.seeAll, { color: '#7C3AED' }]}>Calendrier</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
            {/* Ligne de temps (Timeline) */}
            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />

            {/* Affichage des rendez-vous réels */}
            {todayBookings.length > 0 ? (
              todayBookings.map((booking) => (
                <View key={booking.id} style={styles.timelineItem}>
                  <View style={styles.timelineTimeContainer}>
                    <Text style={[styles.timelineTime, { color: colors.text }]}>
                      {booking.start_time.substring(0, 5)}
                    </Text>
                    <View style={[styles.timelineDot, { backgroundColor: booking.status === 'confirmed' ? '#7C3AED' : '#22C55E' }]} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.timelineCard, { backgroundColor: booking.status === 'confirmed' ? '#7C3AED10' : '#22C55E10', borderColor: booking.status === 'confirmed' ? '#7C3AED30' : '#22C55E30' }]}
                    onPress={() => router.push('/(coiffeur)/reservations')}
                  >
                    <View style={styles.timelineCardContent}>
                      <Text style={[styles.timelineClient, { color: colors.text }]}>
                        {booking.client?.full_name || booking.notes?.replace('Client: ', '') || 'Client'}
                      </Text>
                      <Text style={[styles.timelineService, { color: colors.textSecondary }]}>
                        {booking.service?.name} • {booking.service?.duration_minutes}min
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: booking.status === 'confirmed' ? '#7C3AED' : '#22C55E' }]}>
                      <Text style={styles.statusBadgeText}>
                        {booking.status === 'confirmed' ? 'Confirmé' : 'Payé'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', marginVertical: 10, color: colors.textMuted, fontSize: 13 }}>
                Aucun rendez-vous aujourd&apos;hui
              </Text>
            )}

            {/* Suggestions de créneaux libres (Exemple simple) */}
            {['10:00', '13:30', '16:00'].map(time => {
              const isSlotTaken = todayBookings.some(b => b.start_time.startsWith(time));
              if (isSlotTaken) return null;

              return (
                <View key={time} style={styles.timelineItem}>
                  <View style={styles.timelineTimeContainer}>
                    <Text style={[styles.timelineTime, { color: colors.textMuted }]}>{time}</Text>
                    <View style={[styles.timelineDot, { backgroundColor: colors.border }]} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.emptySlot, { borderStyle: 'dashed', borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedSlotTime(time);
                      setBookingModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.textMuted} />
                    <Text style={[styles.emptySlotText, { color: colors.textMuted }]}>Ajouter un RDV manuel</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />

        {/* Modal Réservation Manuelle */}
        <Modal
          visible={bookingModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBookingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nouveau RDV Manuel</Text>
                <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Information Horaires d'ouverture */}
                {(() => {
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const todayName = days[new Date().getDay()];
                  const schedule = salon?.opening_hours ? (salon.opening_hours as any)[todayName] : null;
                  
                  if (!schedule) return null;

                  return (
                    <View style={[styles.openingHoursBadge, { backgroundColor: schedule.closed ? colors.error + '10' : colors.success + '10' }]}>
                      <Ionicons 
                        name={schedule.closed ? "lock-closed" : "time"} 
                        size={16} 
                        color={schedule.closed ? colors.error : colors.success} 
                      />
                      <Text style={[styles.openingHoursText, { color: schedule.closed ? colors.error : colors.success }]}>
                        {schedule.closed 
                          ? "Attention : Le salon est fermé aujourd'hui" 
                          : `Horaires d'ouverture : ${schedule.open} - ${schedule.close}`}
                      </Text>
                    </View>
                  );
                })()}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Heure du rendez-vous (modifiable)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={selectedSlotTime}
                    onChangeText={setSelectedSlotTime}
                    placeholder="Ex: 10:30"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Nom du client</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: Sophie Martin"
                    placeholderTextColor={colors.textMuted}
                    value={manualClientName}
                    onChangeText={setManualClientName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Prestations sélectionnées</Text>
                  <View style={styles.selectedServicesContainer}>
                    {selectedServicesList.map((service, index) => (
                      <View key={index} style={[styles.selectedServiceTag, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
                        <Text style={[styles.selectedServiceTagText, { color: colors.text }]}>
                          {service.name} ({service.duration}min)
                        </Text>
                        <TouchableOpacity onPress={() => removeServiceFromBooking(index)}>
                          <Ionicons name="close-circle" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {selectedServicesList.length === 0 && (
                      <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 13 }}>
                        Aucune prestation ajoutée. Choisissez dans la liste ci-dessous.
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Choisir des services à ajouter</Text>
                  
                  {/* Sélecteur de catégorie déroulant */}
                  <View style={styles.categorizedPicker}>
                    {HAIRSTYLE_CATEGORIES.map(category => (
                      <View key={category.id} style={styles.categoryPickerGroup}>
                        <TouchableOpacity
                          style={[
                            styles.categoryHeaderItem,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            expandedCategoryId === category.id && { borderColor: category.color, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                          ]}
                          onPress={() => setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id)}
                        >
                          <Text style={{ fontSize: 20 }}>{category.emoji}</Text>
                          <Text style={[styles.categoryHeaderText, { color: colors.text }]}>{category.title}</Text>
                          <Ionicons 
                            name={expandedCategoryId === category.id ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color={colors.textMuted} 
                          />
                        </TouchableOpacity>

                        {expandedCategoryId === category.id && (
                          <View style={[styles.styleItemsList, { borderColor: category.color, backgroundColor: category.color + '05' }]}>
                            {category.styles.map(style => {
                              return (
                                <TouchableOpacity
                                  key={style.id}
                                  style={styles.styleItemRow}
                                  onPress={() => {
                                    addServiceToBooking(
                                      style.name, 
                                      "0", // Prix à définir par le coiffeur ou suggéré
                                      style.duration?.replace(/[^0-9]/g, '').split('-')[0] || '60'
                                    );
                                  }}
                                >
                                  <Text style={[styles.styleItemText, { color: colors.text }]}>{style.name}</Text>
                                  <Ionicons name="add-circle" size={24} color={category.color} />
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Résumé Final (Editable) */}
                  <View style={[styles.customServiceForm, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Détails finaux de la réservation</Text>
                    <View style={styles.formGroupCompact}>
                      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Libellé complet (automatique)</Text>
                      <TextInput
                        style={[styles.inputSmall, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={customServiceName}
                        onChangeText={setCustomServiceName}
                        multiline
                      />
                    </View>
                    <View style={styles.row}>
                      <View style={[styles.formGroupCompact, { flex: 1 }]}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Prix Total (€)</Text>
                        <TextInput
                          style={[styles.inputSmall, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={customServicePrice}
                          onChangeText={setCustomServicePrice}
                        />
                      </View>
                      <View style={[styles.formGroupCompact, { flex: 1 }]}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Durée Totale (min)</Text>
                        <TextInput
                          style={[styles.inputSmall, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="60"
                          keyboardType="numeric"
                          value={customServiceDuration}
                          onChangeText={setCustomServiceDuration}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    { backgroundColor: '#191919' },
                    (!manualClientName || (!selectedService && !isCustomService)) && { opacity: 0.5 }
                  ]}
                  onPress={handleManualBooking}
                  disabled={isSavingBooking || !manualClientName || (!selectedService && !isCustomService)}
                >
                  {isSavingBooking ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Enregistrer le rendez-vous</Text>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  /* Business Widget Styles */
  businessCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    ...Shadows.md,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  businessLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  businessFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 16,
  },
  footerStat: {
    flex: 1,
    alignItems: 'center',
  },
  footerStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerStatLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  marketingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  marketingCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  marketingCardText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  /* Timeline Agenda Styles */
  timelineContainer: {
    paddingLeft: 8,
    marginTop: 10,
  },
  timelineLine: {
    position: 'absolute',
    left: 55,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timelineTimeContainer: {
    width: 65,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 10,
  },
  timelineCardContent: {
    flex: 1,
  },
  timelineClient: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineService: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptySlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 10,
    gap: 8,
  },
  emptySlotText: {
    fontSize: 13,
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
  onboardingCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  onboardingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  onboardingSubtitle: {
    fontSize: 13,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepsContainer: {
    gap: 12,
  },
  onboardingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
  },
  /* Manual Booking Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  servicesList: {
    gap: 10,
  },
  serviceSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  serviceNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceMetaText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  customServiceForm: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginTop: 4,
    gap: 12,
  },
  formGroupCompact: {
    gap: 4,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputSmall: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  /* Categorized Picker Styles */
  categorizedPicker: {
    gap: 8,
    marginBottom: 16,
  },
  categoryPickerGroup: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  categoryHeaderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  styleItemsList: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 4,
  },
  styleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  styleItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectedServiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  selectedServiceTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  openingHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  openingHoursText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
