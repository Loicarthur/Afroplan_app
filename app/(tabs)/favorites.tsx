/**
 * Page Favoris AfroPlan
 * Design épuré - Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 2 - Spacing.md) / 2;

// Données de test pour les salons favoris
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

// Données de test pour les styles sauvegardés
const SAVED_STYLES = [
  {
    id: '1',
    name: 'Box Braids Longues',
    price: '150-200€',
    category: 'braids',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  },
  {
    id: '2',
    name: 'Cornrows Design',
    price: '90-150€',
    category: 'braids',
    image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
  },
  {
    id: '3',
    name: 'Faux Locs',
    price: '180-250€',
    category: 'locs',
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400',
  },
  {
    id: '4',
    name: 'Passion Twists',
    price: '120-180€',
    category: 'twists',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },
];

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRemoveSalon = (salonId: string) => {
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
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header simple et élégant */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Favoris</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Vos salons et styles préférés
          </Text>
        </View>

        {/* Salons Favoris */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Salons ({FAVORITE_SALONS.length})
            </Text>
          </View>

          {FAVORITE_SALONS.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.sm]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: salon.image }} style={styles.salonImage} contentFit="cover" />
              <View style={styles.salonContent}>
                <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#FBBF24" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>{salon.rating}</Text>
                  <Text style={[styles.reviewsText, { color: colors.textMuted }]}>
                    ({salon.reviews_count} avis)
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>{salon.address}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleRemoveSalon(salon.id)}
              >
                <Ionicons name="heart" size={18} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Styles sauvegardés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Styles ({SAVED_STYLES.length})
            </Text>
          </View>

          <View style={styles.stylesGrid}>
            {SAVED_STYLES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.styleCard, { backgroundColor: colors.card }, Shadows.sm]}
                activeOpacity={0.7}
              >
                <View style={styles.styleImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.styleImage} contentFit="cover" />
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.categoryText, { color: colorScheme === 'dark' ? '#191919' : '#FFFFFF' }]}>
                      {getCategoryLabel(item.category)}
                    </Text>
                  </View>
                </View>
                <View style={styles.styleInfo}>
                  <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.stylePrice, { color: colors.textSecondary }]}>
                    {item.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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

  /* Header */
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: FontSizes.md,
    marginTop: 4,
  },

  /* Section */
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },

  /* Salon Card */
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  salonImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  salonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  salonName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: FontSizes.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: FontSizes.sm,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Styles Grid */
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  styleCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
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
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  styleInfo: {
    padding: Spacing.sm,
  },
  styleName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  stylePrice: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
