/**
 * Page Favoris AfroPlan
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// Donnees de test pour les salons favoris
const FAVORITE_SALONS = [
  {
    id: '1',
    name: 'Bella Coiffure',
    rating: 4.9,
    reviews_count: 234,
    address: 'Paris 18e',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    rating: 4.8,
    reviews_count: 189,
    address: 'Lyon 2e',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
  },
];

// Donnees de test pour les styles sauvegardes
const SAVED_STYLES = [
  {
    id: '1',
    name: 'Box Braids Longues',
    price: '150-200€',
    category: 'braids',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    badgeColor: '#191919',
  },
  {
    id: '2',
    name: 'Cornrows Design',
    price: '90-150€',
    category: 'braids',
    image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
    badgeColor: '#191919',
  },
  {
    id: '3',
    name: 'Faux Locs',
    price: '180-250€',
    category: 'locs',
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400',
    badgeColor: '#4A4A4A',
  },
  {
    id: '4',
    name: 'Passion Twists',
    price: '120-180€',
    category: 'twists',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    badgeColor: '#4A4A4A',
  },
];

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRemoveSalon = (salonId: string) => {
    // TODO: Remove from favorites
    console.log('Remove salon:', salonId);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      braids: 'Braids',
      natural: 'Natural',
      twists: 'Twists',
      locs: 'Locs',
      weave: 'Weave',
    };
    return labels[category] || category;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Mes Favoris</Text>
            <Text style={styles.headerSubtitle}>Vos salons et styles préférés</Text>
          </View>
        </View>

        {/* Salons Favoris Section */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Salons Favoris ({FAVORITE_SALONS.length})
          </Text>

          {FAVORITE_SALONS.map((salon) => (
            <View
              key={salon.id}
              style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.sm]}
            >
              <Image
                source={{ uri: salon.image }}
                style={styles.salonImage}
                contentFit="cover"
              />
              <View style={styles.salonContent}>
                <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {salon.rating}
                  </Text>
                  <Text style={[styles.reviewsText, { color: colors.textMuted }]}>
                    • {salon.reviews_count} avis
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {salon.address}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveSalon(salon.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Styles Sauvegardes Section */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Styles Sauvegardes ({SAVED_STYLES.length})
          </Text>

          <View style={styles.stylesGrid}>
            {SAVED_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[styles.styleCard, { backgroundColor: colors.card }, Shadows.md]}
              >
                <View style={styles.styleImageContainer}>
                  <Image
                    source={{ uri: style.image }}
                    style={styles.styleImage}
                    contentFit="cover"
                  />
                  {/* Category badge */}
                  <View style={[styles.categoryBadge, { backgroundColor: style.badgeColor }]}>
                    <Text style={styles.badgeText}>{getCategoryLabel(style.category)}</Text>
                  </View>
                </View>
                <View style={styles.styleInfo}>
                  <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                    {style.name}
                  </Text>
                  <Text style={[styles.stylePrice, { color: '#191919' }]}>
                    {style.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#191919',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  salonImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  salonContent: {
    flex: 1,
    marginLeft: 12,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  styleCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  styleImageContainer: {
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: 140,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  styleInfo: {
    padding: 12,
  },
  styleName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  stylePrice: {
    fontSize: 12,
    fontWeight: '600',
  },
});
