/**
 * Page d'accueil AfroPlan - Client
 * Enrichie avec flow de recherche et plus de contenu
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
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/theme';
import { AuthGuardModal } from '@/components/ui';
import SearchFlowModal from '@/components/SearchFlowModal';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationModal from '@/components/NotificationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSalons } from '@/hooks/use-salons';
import { SalonCard } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

/* -------------------- Données mock -------------------- */

// Catégories de styles de coiffure (depuis la source unique)
const ALL_STYLES = HAIRSTYLE_CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.title,
  emoji: cat.emoji,
  color: cat.color,
  // use first sub-style image as preview
  image: cat.styles[0]?.image,
  firstStyleId: cat.styles[0]?.id,
}));


// Coiffeurs à proximité
const NEARBY_COIFFEURS = [
  {
    id: '1',
    name: 'Marie Koné',
    specialty: 'Tresses africaines',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 km',
    image: require('@/assets/images/Tissage.jpg'),
    available: true,
    price: 'À partir de 45€',
  },
  {
    id: '2',
    name: 'Fatou Diallo',
    specialty: 'Twists & Locks',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 km',
    image: require('@/assets/images/Vanille.jpg'),
    available: true,
    price: 'À partir de 35€',
  },
  {
    id: '3',
    name: 'Aminata Bamba',
    specialty: 'Natural Hair',
    rating: 4.7,
    reviews: 64,
    distance: '2.1 km',
    image: require('@/assets/images/Wash_and_Go.jpg'),
    available: false,
    price: 'À partir de 30€',
  },
];

// Salons populaires
const POPULAR_SALONS = [
  {
    id: '1',
    name: 'Bella Coiffure',
    services: ['Tresses', 'Twists', 'Coloration'],
    priceRange: '30€ - 150€',
    rating: 4.9,
    reviews: 234,
    image: require('@/assets/images/Box_Braids.jpg'),
    location: 'Paris 18e',
    openNow: true,
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    services: ['Locks', 'Coupe homme', 'Entretien'],
    priceRange: '20€ - 100€',
    rating: 4.8,
    reviews: 156,
    image: require('@/assets/images/Fausse_Locks.jpg'),
    location: 'Paris 11e',
    openNow: true,
  },
  {
    id: '3',
    name: 'Natural Beauty',
    services: ['Soins', 'Hydratation', 'Coupe'],
    priceRange: '25€ - 80€',
    rating: 4.7,
    reviews: 98,
    image: require('@/assets/images/Soin.jpg'),
    location: 'Paris 10e',
    openNow: false,
  },
];

// Conseils et inspirations
const TIPS_AND_INSPIRATION = [
  {
    id: '1',
    title: 'Comment entretenir ses tresses ?',
    category: 'Conseils',
    image: require('@/assets/images/afro_image1.jpg'),
    readTime: '3 min',
  },
  {
    id: '2',
    title: 'Les tendances coiffures 2024',
    category: 'Tendances',
    image: require('@/assets/images/afro_image2.jpg'),
    readTime: '5 min',
  },
  {
    id: '3',
    title: 'Routine capillaire cheveux crépus',
    category: 'Tutoriel',
    image: require('@/assets/images/afro_image3.jpg'),
    readTime: '4 min',
  },
];

/* -------------------- Composants -------------------- */

function SectionHeader({ title, onSeeAll, seeAllLabel }: { title: string; onSeeAll?: () => void; seeAllLabel?: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: '#191919' }]}>{seeAllLabel ?? 'Voir tout'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* -------------------- Screen -------------------- */

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, profile, user } = useAuth();
  const { requireAuth, showAuthModal, setShowAuthModal } = useAuthGuard();
  const { t, language } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  const { salons, isLoading: loadingSalons, refresh: refreshSalons } = useSalons();

  const fetchActiveBookingsCount = React.useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const { bookingService } = await import('@/services/booking.service');
        const response = await bookingService.getClientBookings(user.id);
        const count = response.data.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
        setActiveBookingsCount(count);
      } catch (e) {
        setActiveBookingsCount(0);
      }
    }
  }, [isAuthenticated, user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBookingsCount();
      refreshSalons();
    }, [fetchActiveBookingsCount, refreshSalons])
  );

  const handleSwitchToCoiffeur = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'coiffeur');
    router.replace('/(coiffeur)');
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshSalons().finally(() => setRefreshing(false));
  }, [refreshSalons]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleSearch = (filters: any) => {
    // Appliquer les filtres de recherche
    router.push({
      pathname: '/(tabs)/explore',
      params: { 
        category: filters.hairstyle,
        serviceName: filters.subStyle,
        budget: filters.maxBudget,
        distance: filters.maxDistance,
        location: filters.location,
        showAll: filters.showAll ? 'true' : 'false'
      }
    });
  };

  const displayedStyles = showAllStyles ? ALL_STYLES : ALL_STYLES.slice(0, 6);
  
  // Featured salons: highest rated verified salons
  const featuredSalons = [...salons].filter(s => s.is_verified).sort((a, b) => b.rating - a.rating).slice(0, 5);
  // Popular salons: most reviews
  const popularSalons = [...salons].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 6);
  // Nearby (just newest for now)
  const nearbySalons = [...salons].reverse().slice(0, 6);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Search Flow Modal */}
      <SearchFlowModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
      />

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ---------------- Header ---------------- */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            {/* Logo arrondi à gauche */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo_afroplan.jpeg')}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>

            {/* Boutons à droite */}
            {!isAuthenticated ? (
              <View style={styles.authButtons}>
                <LanguageSelector compact />
                <TouchableOpacity
                  style={styles.switchRoleButton}
                  onPress={handleSwitchToCoiffeur}
                >
                  <Ionicons name="swap-horizontal" size={16} color="#191919" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'client' } })}
                >
                  <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'client' } })}
                >
                  <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={[styles.notificationButton, { backgroundColor: colors.card }]}
                  onPress={() => router.push('/(tabs)/reservations')}
                >
                  <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                  {activeBookingsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{activeBookingsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.notificationButton, { backgroundColor: colors.card }]}
                  onPress={() => setNotificationModalVisible(true)}
                >
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Welcome message */}
          {isAuthenticated && profile && (
            <View style={styles.welcomeMessage}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                {language === 'fr' ? 'Bonjour' : 'Hello'} {profile.full_name?.split(' ')[0] || 'toi'} 👋
              </Text>
              <Text style={[styles.welcomeSubtext, { color: colors.text }]}>
                {language === 'fr' ? 'Disponible pour une nouvelle coiffure ?' : 'Available for a new hairstyle?'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ---------------- Main Search Button ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.searchSection}
        >
          <TouchableOpacity
            style={styles.mainSearchButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <View style={styles.searchButtonContent}>
              <View style={styles.searchIconContainer}>
                <Ionicons name="search" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchButtonTitle}>{t('home.searchSalon')}</Text>
                <Text style={styles.searchButtonSubtitle}>{t('home.searchSubtitle')}</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#191919" />
          </TouchableOpacity>
        </Animated.View>


        {/* ---------------- Featured Salons ---------------- */}
        {featuredSalons.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.section}
          >
            <SectionHeader 
              title={language === 'fr' ? 'À la une' : 'Featured Salons'} 
              onSeeAll={() => router.push('/(tabs)/explore')} 
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {featuredSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} variant="featured" />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ---------------- Quick Categories ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
          style={styles.section}
        >
          <SectionHeader
            title={language === 'fr' ? 'Catégories de coiffures' : 'Hairstyle Categories'}
            onSeeAll={() => setShowAllStyles(!showAllStyles)}
            seeAllLabel={showAllStyles ? (language === 'fr' ? 'Voir moins' : 'See less') : t('common.seeAll')}
          />
          <View style={styles.stylesGrid}>
            {displayedStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={styles.styleCard}
                onPress={() => {
                  router.push(`/category-styles/${style.id}`);
                }}
              >
                <Image source={style.image} style={styles.styleImage} contentFit="cover" />
                <View style={styles.styleOverlay}>
                  <Text style={styles.styleName} numberOfLines={2}>{style.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ---------------- Coiffeurs à proximité ---------------- */}
        {nearbySalons.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            style={styles.section}
          >
            <SectionHeader title={language === 'fr' ? 'Nouveautés à proximité' : 'Nearby New Salons'} onSeeAll={() => router.push('/(tabs)/explore')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {nearbySalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} variant="default" />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ---------------- Salons populaires ---------------- */}
        {popularSalons.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(450).duration(500)}
            style={styles.section}
          >
            <SectionHeader title={t('home.popularSalons')} onSeeAll={() => router.push('/(tabs)/explore')} />
            <View style={styles.popularGrid}>
              {popularSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} variant="horizontal" />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ---------------- Tips & Inspiration ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.section}
        >
          <SectionHeader title={t('home.tipsAndInspiration')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {TIPS_AND_INSPIRATION.map((tip) => (
              <TouchableOpacity key={tip.id} style={styles.tipCard}>
                <Image source={tip.image} style={styles.tipImage} contentFit="cover" />
                <View style={styles.tipOverlay}>
                  <View style={styles.tipCategoryBadge}>
                    <Text style={styles.tipCategoryText}>{tip.category}</Text>
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <View style={styles.tipMeta}>
                      <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.tipReadTime}>{tip.readTime}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ---------------- Become a Pro CTA ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(550).duration(500)}
          style={styles.section}
        >
          <View style={styles.ctaCard}>
            <View style={styles.ctaContent}>
              <Ionicons name="cut" size={32} color="#FFFFFF" />
              <Text style={styles.ctaTitle}>{t('home.areYouCoiffeur')}</Text>
              <Text style={styles.ctaSubtitle}>
                {t('home.joinAfroPlanPro')}
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
              >
                <Text style={styles.ctaButtonText}>{t('home.discoverPro')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#191919" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ---------------- Footer avec réseaux sociaux ---------------- */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => openLink('mailto:support@afroplan.com')}>
                <Text style={[styles.footerLink, { color: '#191919' }]}>Support</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity onPress={() => router.push('/terms')}>
                <Text style={[styles.footerLink, { color: '#191919' }]}>CGU</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={[styles.footerLink, { color: '#191919' }]}>Confidentialité</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Rejoignez-nous</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink('https://www.instagram.com/afro._plan?igsh=ODRhaWt6aWpsdHY=')}
              >
                <Ionicons name="logo-instagram" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink('https://www.linkedin.com/company/afro-plan/')}
              >
                <Ionicons name="logo-linkedin" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.copyright}>
            © 2024 AfroPlan. Tous droits réservés.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Auth Guard Modal */}
      <AuthGuardModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Connectez-vous pour voir les détails du salon et réserver"
      />
    </SafeAreaView>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
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
  welcomeMessage: {
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 14,
  },
  welcomeSubtext: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },

  // Main Search
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mainSearchButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#191919',
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
  },
  searchButtonSubtitle: {
    fontSize: 13,
    color: '#808080',
    marginTop: 2,
  },

  // Sections
  section: {
    paddingTop: 20,
    paddingHorizontal: 16,
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
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Horizontal scroll
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  // Styles grid
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: (width - 56) / 3,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    justifyContent: 'flex-end',
  },
  styleEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  styleName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showLessText: {
    fontSize: 14,
    fontWeight: '500',
  },

  popularGrid: {
    gap: 12,
    paddingBottom: 8,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  // Tips
  tipCard: {
    width: 240,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipImage: {
    width: '100%',
    height: '100%',
  },
  tipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    justifyContent: 'space-between',
  },
  tipCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipContent: {},
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipReadTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // CTA
  ctaCard: {
    backgroundColor: '#191919',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191919',
  },

  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f9f8f8',
  },
  footerTop: {
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 6,
    color: '#808080',
  },
  socialSection: {
    backgroundColor: '#191919',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    fontSize: 11,
    textAlign: 'center',
    color: '#808080',
    marginBottom: 8,
  },
});
