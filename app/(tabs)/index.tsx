/**
 * Page d'accueil AfroPlan - Client
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 * Layout inspiré de p1 avec logo arrondi et boutons bien placés
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

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

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

// Coiffeurs à proximité
const NEARBY_COIFFEURS = [
  {
    id: '1',
    name: 'Marie Koné',
    specialty: 'Tresses africaines',
    rating: 4.9,
    distance: '0.8 km',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200',
    available: true,
  },
  {
    id: '2',
    name: 'Fatou Diallo',
    specialty: 'Twists & Locs',
    rating: 4.8,
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200',
    available: true,
  },
  {
    id: '3',
    name: 'Aminata Bamba',
    specialty: 'Natural Hair',
    rating: 4.7,
    distance: '2.1 km',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200',
    available: false,
  },
];

// Services des salons
const SALON_SERVICES = [
  {
    id: '1',
    name: 'Bella Coiffure',
    services: ['Tresses', 'Twists', 'Coloration'],
    priceRange: '30€ - 150€',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    services: ['Locs', 'Coupe homme', 'Entretien'],
    priceRange: '20€ - 100€',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
  },
  {
    id: '3',
    name: 'Natural Beauty',
    services: ['Soins', 'Hydratation', 'Coupe'],
    priceRange: '25€ - 80€',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },
];

// Magasins de produits afro
const AFRO_SHOPS = [
  {
    id: '1',
    name: 'Afro Beauty Shop',
    type: 'Produits capillaires',
    address: 'Paris 18e',
    image: 'https://images.unsplash.com/photo-1556228578-567da1a85a4f?w=400',
  },
  {
    id: '2',
    name: 'Natural Hair Store',
    type: 'Cosmétiques naturels',
    address: 'Paris 11e',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  },
  {
    id: '3',
    name: 'Ethnic Beauty',
    type: 'Perruques & Extensions',
    address: 'Paris 10e',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
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
          <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* -------------------- Screen -------------------- */

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const displayedStyles = showAllStyles ? ALL_STYLES : ALL_STYLES.slice(0, 4);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ---------------- Header (style p1) ---------------- */}
        <View style={styles.header}>
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
<<<<<<< Updated upstream
                <TouchableOpacity style={styles.loginButton}>
                  <Text style={styles.loginButtonText}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.registerButton}>
=======
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'client' } })}
                >
>>>>>>> Stashed changes
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
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ---------------- Barre de recherche ---------------- */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <Text style={[styles.searchPlaceholder, { color: colors.placeholder }]}>
              Rechercher un salon, style...
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- Tous les styles de coiffure ---------------- */}
        <View style={styles.section}>
          <SectionHeader
            title="Styles de coiffure"
            onSeeAll={() => setShowAllStyles(!showAllStyles)}
          />
          <View style={styles.stylesGrid}>
            {displayedStyles.map((style) => (
              <TouchableOpacity key={style.id} style={styles.styleCard}>
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
              <Text style={[styles.showLessText, { color: colors.primary }]}>Voir moins</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---------------- Coiffeurs à proximité ---------------- */}
        <View style={styles.section}>
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
                onPress={() => router.push(`/salon/${coiffeur.id}`)}
              >
                <Image source={{ uri: coiffeur.image }} style={styles.coiffeurImage} contentFit="cover" />
                {coiffeur.available && <View style={styles.availableBadge}><Text style={styles.availableText}>Dispo</Text></View>}
                <View style={styles.coiffeurInfo}>
                  <Text style={[styles.coiffeurName, { color: colors.text }]}>{coiffeur.name}</Text>
                  <Text style={[styles.coiffeurSpecialty, { color: colors.textSecondary }]}>{coiffeur.specialty}</Text>
                  <View style={styles.coiffeurMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color="#191919" />
                      <Text style={[styles.ratingText, { color: colors.text }]}>{coiffeur.rating}</Text>
                    </View>
                    <Text style={[styles.distanceText, { color: colors.textMuted }]}>{coiffeur.distance}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ---------------- Services des salons ---------------- */}
        <View style={styles.section}>
          <SectionHeader title="Services proposés" onSeeAll={() => router.push('/(tabs)/explore')} />
          {SALON_SERVICES.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.serviceCard, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => router.push(`/salon/${salon.id}`)}
            >
              <Image source={{ uri: salon.image }} style={styles.serviceImage} contentFit="cover" />
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: colors.text }]}>{salon.name}</Text>
                <Text style={[styles.servicesList, { color: colors.textSecondary }]}>
                  {salon.services.join(' • ')}
                </Text>
                <View style={styles.serviceMeta}>
                  <Text style={[styles.priceRange, { color: colors.primary }]}>{salon.priceRange}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#191919" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{salon.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------------- Magasins produits afro ---------------- */}
        <View style={styles.section}>
          <SectionHeader title="Magasins de produits afro" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {AFRO_SHOPS.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopCard, { backgroundColor: colors.card }]}
              >
                <Image source={{ uri: shop.image }} style={styles.shopImage} contentFit="cover" />
                <View style={styles.shopInfo}>
                  <Text style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
                  <Text style={[styles.shopType, { color: colors.textSecondary }]}>{shop.type}</Text>
                  <View style={styles.shopLocation}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.shopAddress, { color: colors.textMuted }]}>{shop.address}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ---------------- Footer avec réseaux sociaux ---------------- */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>Suivez-nous</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://instagram.com/afroplan')}
            >
              <Ionicons name="logo-instagram" size={24} color="#191919" />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://tiktok.com/@afroplan')}
            >
              <Ionicons name="logo-tiktok" size={24} color="#191919" />
              <Text style={styles.socialText}>TikTok</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openLink('https://linkedin.com/company/afroplan')}
            >
              <Ionicons name="logo-linkedin" size={24} color="#191919" />
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => openLink('mailto:support@afroplan.com')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Support</Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.primary }]}>CGU</Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Confidentialité</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.copyright, { color: colors.textMuted }]}>
            © 2024 AfroPlan. Tous droits réservés.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header style p1
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
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
    fontWeight: '500',
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
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  coiffeurCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coiffeurImage: {
    width: '100%',
    height: 100,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  coiffeurSpecialty: {
    fontSize: 12,
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
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 11,
  },

  // Services
  serviceCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  serviceInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicesList: {
    fontSize: 13,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Shops
  shopCard: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shopImage: {
    width: '100%',
    height: 120,
  },
  shopInfo: {
    padding: 12,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  shopType: {
    fontSize: 12,
    marginBottom: 6,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopAddress: {
    fontSize: 11,
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  socialButton: {
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 8,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
});
