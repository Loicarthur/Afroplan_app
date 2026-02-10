/**
 * Page d'accueil AfroPlan - Client
 * Enrichie avec flow de recherche, promotions, et plus de contenu
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { AuthGuardModal } from '@/components/ui';
import SearchFlowModal from '@/components/SearchFlowModal';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

/* -------------------- Données mock -------------------- */

// Tous les styles de coiffure
const ALL_STYLES = [
  { id: '1', name: 'Tresses', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200' },
  { id: '2', name: 'Twists', image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200' },
  { id: '3', name: 'Natural', image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=200' },
  { id: '4', name: 'Locs', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200' },
  { id: '5', name: 'Weave', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200' },
  { id: '6', name: 'Braids', image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200' },
  { id: '7', name: 'Cornrows', image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=200' },
  { id: '8', name: 'Afro', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200' },
];

// Promotions
const PROMOTIONS = [
  {
    id: '1',
    title: '-20% sur les tresses',
    subtitle: 'Valable ce weekend',
    salon: 'Bella Coiffure',
    color: '#7C3AED',
  },
  {
    id: '2',
    title: 'Première visite offerte',
    subtitle: 'Consultation gratuite',
    salon: 'Afro Style Studio',
    color: '#22C55E',
  },
  {
    id: '3',
    title: '-15% pour les étudiants',
    subtitle: 'Sur présentation carte',
    salon: 'Natural Beauty',
    color: '#F59E0B',
  },
];

// Coiffeurs à proximité
const NEARBY_COIFFEURS = [
  {
    id: '1',
    name: 'Marie Koné',
    specialty: 'Tresses africaines',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 km',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200',
    available: true,
    price: 'À partir de 45€',
  },
  {
    id: '2',
    name: 'Fatou Diallo',
    specialty: 'Twists & Locs',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200',
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
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200',
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
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    location: 'Paris 18e',
    openNow: true,
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    services: ['Locs', 'Coupe homme', 'Entretien'],
    priceRange: '20€ - 100€',
    rating: 4.8,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
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
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
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
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    readTime: '3 min',
  },
  {
    id: '2',
    title: 'Les tendances coiffures 2024',
    category: 'Tendances',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
    readTime: '5 min',
  },
  {
    id: '3',
    title: 'Routine capillaire cheveux crépus',
    category: 'Tutoriel',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    readTime: '4 min',
  },
];

/* -------------------- Composants -------------------- */

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: '#191919' }]}>Voir tout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* -------------------- Screen -------------------- */

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, profile } = useAuth();
  const { requireAuth, showAuthModal, setShowAuthModal } = useAuthGuard();

  const [refreshing, setRefreshing] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleSearch = (filters: any) => {
    // TODO: appliquer les filtres de recherche
    router.push('/(tabs)/explore');
  };

  const displayedStyles = showAllStyles ? ALL_STYLES : ALL_STYLES.slice(0, 4);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Search Flow Modal */}
      <SearchFlowModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
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

            {/* Boutons Inscription/Connexion à droite */}
            {!isAuthenticated ? (
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'client' } })}
                >
                  <Text style={styles.registerButtonText}>Inscription</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'client' } })}
                >
                  <Text style={styles.loginButtonText}>Connexion</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={[styles.notificationButton, { backgroundColor: colors.card }]}
                  onPress={() => router.push('/(tabs)/bookings')}
                >
                  <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>1</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Welcome message */}
          {isAuthenticated && profile && (
            <View style={styles.welcomeMessage}>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                Bonjour {profile.full_name?.split(' ')[0] || 'toi'} 👋
              </Text>
              <Text style={[styles.welcomeSubtext, { color: colors.text }]}>
                Prêt(e) pour une nouvelle coiffure ?
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
                <Text style={styles.searchButtonTitle}>Rechercher mon salon / coiffeur</Text>
                <Text style={styles.searchButtonSubtitle}>Trouve le style qui te correspond</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#191919" />
          </TouchableOpacity>
        </Animated.View>

        {/* ---------------- Promotions ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.section}
        >
          <SectionHeader title="Offres du moment" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {PROMOTIONS.map((promo) => (
              <TouchableOpacity
                key={promo.id}
                style={[styles.promoCard, { backgroundColor: promo.color }]}
              >
                <Ionicons name="pricetag" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                <Text style={styles.promoSalon}>{promo.salon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ---------------- Quick Categories ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
          style={styles.section}
        >
          <SectionHeader
            title="Styles de coiffure"
            onSeeAll={() => setShowAllStyles(!showAllStyles)}
          />
          <View style={styles.stylesGrid}>
            {displayedStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={styles.styleCard}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Image source={{ uri: style.image }} style={styles.styleImage} contentFit="cover" />
                <View style={styles.styleOverlay}>
                  <Text style={styles.styleName}>{style.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {showAllStyles && (
            <TouchableOpacity
              style={styles.showLessButton}
              onPress={() => setShowAllStyles(false)}
            >
              <Text style={[styles.showLessText, { color: '#191919' }]}>Voir moins</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ---------------- Coiffeurs à proximité ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.section}
        >
          <SectionHeader title="Coiffeurs à proximité" onSeeAll={() => router.push('/(tabs)/explore')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {NEARBY_COIFFEURS.map((coiffeur) => (
              <TouchableOpacity
                key={coiffeur.id}
                style={[styles.coiffeurCard, { backgroundColor: colors.card }]}
                onPress={() => requireAuth(() => router.push(`/salon/${coiffeur.id}`))}
              >
                <View style={styles.coiffeurImageContainer}>
                  <Image source={{ uri: coiffeur.image }} style={styles.coiffeurImage} contentFit="cover" />
                  {coiffeur.available && (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Dispo</Text>
                    </View>
                  )}
                </View>
                <View style={styles.coiffeurInfo}>
                  <Text style={[styles.coiffeurName, { color: colors.text }]}>{coiffeur.name}</Text>
                  <Text style={[styles.coiffeurSpecialty, { color: colors.textSecondary }]}>{coiffeur.specialty}</Text>
                  <Text style={[styles.coiffeurPrice, { color: '#7C3AED' }]}>{coiffeur.price}</Text>
                  <View style={styles.coiffeurMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={[styles.ratingText, { color: colors.text }]}>{coiffeur.rating}</Text>
                      <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({coiffeur.reviews})</Text>
                    </View>
                    <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={12} color={colors.textMuted} />
                      <Text style={[styles.distanceText, { color: colors.textMuted }]}>{coiffeur.distance}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ---------------- Salons populaires ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(450).duration(500)}
          style={styles.section}
        >
          <SectionHeader title="Salons populaires" onSeeAll={() => router.push('/(tabs)/explore')} />
          {POPULAR_SALONS.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.salonCard, { backgroundColor: colors.card }]}
              onPress={() => requireAuth(() => router.push(`/salon/${salon.id}`))}
            >
              <Image source={{ uri: salon.image }} style={styles.salonImage} contentFit="cover" />
              <View style={styles.salonInfo}>
                <View style={styles.salonHeader}>
                  <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                  {salon.openNow && (
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>Ouvert</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.salonLocation, { color: colors.textSecondary }]}>
                  <Ionicons name="location-outline" size={12} /> {salon.location}
                </Text>
                <Text style={[styles.salonServices, { color: colors.textMuted }]}>
                  {salon.services.join(' • ')}
                </Text>
                <View style={styles.salonMeta}>
                  <Text style={[styles.salonPrice, { color: '#7C3AED' }]}>{salon.priceRange}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{salon.rating}</Text>
                    <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({salon.reviews})</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ---------------- Tips & Inspiration ---------------- */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.section}
        >
          <SectionHeader title="Conseils & Inspiration" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {TIPS_AND_INSPIRATION.map((tip) => (
              <TouchableOpacity key={tip.id} style={styles.tipCard}>
                <Image source={{ uri: tip.image }} style={styles.tipImage} contentFit="cover" />
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
              <Text style={styles.ctaTitle}>Tu es coiffeur(se) ?</Text>
              <Text style={styles.ctaSubtitle}>
                Rejoins AfroPlan Pro et développe ton activité
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}
              >
                <Text style={styles.ctaButtonText}>Découvrir AfroPlan Pro</Text>
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
                onPress={() => openLink('https://tiktok.com/@afroplan')}
              >
                <Ionicons name="logo-tiktok" size={20} color="#FFFFFF" />
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

  // Promotions
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  promoCard: {
    width: 180,
    padding: 16,
    borderRadius: 16,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  promoSalon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },

  // Styles grid
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: (width - 44) / 2,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 25, 25, 0.4)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  styleName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showLessText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Coiffeurs
  coiffeurCard: {
    width: 180,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coiffeurImageContainer: {
    position: 'relative',
  },
  coiffeurImage: {
    width: '100%',
    height: 120,
  },
  availableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  coiffeurInfo: {
    padding: 12,
  },
  coiffeurName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  coiffeurSpecialty: {
    fontSize: 12,
    marginBottom: 4,
  },
  coiffeurPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  coiffeurMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 11,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: 11,
  },

  // Salons
  salonCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  salonImage: {
    width: 110,
    height: 130,
  },
  salonInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  salonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
  },
  openBadge: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22C55E',
  },
  salonLocation: {
    fontSize: 12,
    marginBottom: 4,
  },
  salonServices: {
    fontSize: 12,
    marginBottom: 8,
  },
  salonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salonPrice: {
    fontSize: 14,
    fontWeight: '600',
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
