/**
 * Composant Carte de Salon
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Salon } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;

type SalonCardProps = {
  salon: Salon;
  variant?: 'default' | 'horizontal' | 'featured';
  onFavoritePress?: () => void;
  isFavorite?: boolean;
};

export function SalonCard({
  salon,
  variant = 'default',
  onFavoritePress,
  isFavorite = false,
}: SalonCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    router.push(`/salon/${salon.id}`);
  };

  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={14} color={colors.starFilled} />
      <Text style={[styles.rating, { color: colors.text }]}>
        {salon.rating.toFixed(1)}
      </Text>
      <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
        ({salon.reviews_count})
      </Text>
    </View>
  );

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          { backgroundColor: colors.card },
          Shadows.md,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: salon.image_url || 'https://via.placeholder.com/120x120',
          }}
          style={styles.horizontalImage}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {salon.name}
            </Text>
            {onFavoritePress && (
              <TouchableOpacity onPress={onFavoritePress}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? colors.error : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.location, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {salon.city}
            </Text>
          </View>
          {renderRating()}
          {salon.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>
                Verifie
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity
        style={[
          styles.featuredCard,
          { backgroundColor: colors.card },
          Shadows.lg,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: salon.cover_image_url || salon.image_url || 'https://via.placeholder.com/300x180',
          }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay}>
          {salon.is_verified && (
            <View style={[styles.featuredBadge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
              <Text style={styles.featuredBadgeText}>Verifie</Text>
            </View>
          )}
          {onFavoritePress && (
            <TouchableOpacity
              style={[styles.favoriteButton, { backgroundColor: colors.card }]}
              onPress={onFavoritePress}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? colors.error : colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.featuredContent}>
          <Text
            style={[styles.featuredName, { color: colors.text }]}
            numberOfLines={1}
          >
            {salon.name}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {salon.city}
            </Text>
          </View>
          {renderRating()}
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, width: CARD_WIDTH },
        Shadows.sm,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri: salon.image_url || 'https://via.placeholder.com/150x120',
        }}
        style={styles.image}
      />
      {onFavoritePress && (
        <TouchableOpacity
          style={[styles.cardFavoriteButton, { backgroundColor: colors.card }]}
          onPress={onFavoritePress}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? colors.error : colors.text}
          />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={1}
        >
          {salon.name}
        </Text>
        <Text
          style={[styles.location, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {salon.city}
        </Text>
        {renderRating()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Default card styles
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardFavoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  reviewCount: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },

  // Horizontal card styles
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  horizontalImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  verifiedText: {
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },

  // Featured card styles
  featuredCard: {
    width: width - Spacing.md * 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: {
    padding: Spacing.md,
  },
  featuredName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
});
