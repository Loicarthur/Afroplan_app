import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

  const isOpen = () => {
    if (!salon.opening_hours) return true;
    try {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[new Date().getDay()];
      const schedule = (salon.opening_hours as any)[today];
      if (!schedule || schedule.closed || schedule.active === false) return false;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const openTime = schedule.open || schedule.start;
      const closeTime = schedule.close || schedule.end;
      
      return currentTime >= openTime && currentTime <= closeTime;
    } catch (e) {
      return true;
    }
  };

  const renderRating = (size: number = 14) => (
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={size} color="#F59E0B" />
      <Text style={[styles.rating, { color: colors.text, fontSize: size }]}>
        {salon.rating > 0 ? salon.rating.toFixed(1) : 'New'}
      </Text>
      {salon.reviews_count > 0 && (
        <Text style={[styles.reviewCount, { color: colors.textSecondary, fontSize: size - 2 }]}>
          ({salon.reviews_count})
        </Text>
      )}
    </View>
  );

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          { backgroundColor: colors.card },
          Shadows.sm,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: salon.image_url || 'https://via.placeholder.com/300x300?text=Salon' }}
          style={styles.horizontalImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {salon.name}
            </Text>
            {onFavoritePress && (
              <TouchableOpacity onPress={onFavoritePress} style={styles.miniFavorite}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? colors.error : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
              {salon.city}
            </Text>
          </View>

          <View style={styles.horizontalFooter}>
            {renderRating()}
            <View style={[styles.statusIndicator, { backgroundColor: isOpen() ? colors.success + '15' : colors.error + '15' }]}>
              <Text style={[styles.statusText, { color: isOpen() ? colors.success : colors.error }]}>
                {isOpen() ? 'Ouvert' : 'Fermé'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity
        style={[styles.featuredCard, { backgroundColor: colors.card }, Shadows.md]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: salon.cover_image_url || salon.image_url || 'https://via.placeholder.com/600x400?text=Featured' }}
          style={styles.featuredImage}
          contentFit="cover"
          transition={500}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        />
        
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadges}>
            {salon.is_verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(34, 197, 94, 0.9)' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>Vérifié</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: isOpen() ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)' }]}>
              <Text style={styles.badgeText}>{isOpen() ? 'Ouvert' : 'Fermé'}</Text>
            </View>
          </View>
          
          {onFavoritePress && (
            <TouchableOpacity
              style={[styles.favoriteCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={onFavoritePress}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.featuredContent}>
          <Text style={styles.featuredName} numberOfLines={1}>{salon.name}</Text>
          <View style={styles.featuredMeta}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featuredLocation}>{salon.city}</Text>
            </View>
            {renderRating(16)}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant (Grid/Horizontal Scroll)
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card },
        Shadows.sm,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: salon.image_url || 'https://via.placeholder.com/300x300?text=Salon' }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={[styles.availableBadge, { backgroundColor: isOpen() ? '#22C55E' : '#6B7280' }]}>
          <Text style={styles.availableText}>{isOpen() ? 'Dispo' : 'Fermé'}</Text>
        </View>
        {onFavoritePress && (
          <TouchableOpacity
            style={styles.cardFavoriteButton}
            onPress={onFavoritePress}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? colors.error : '#FFFFFF'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {salon.name}
        </Text>
        <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>
          {salon.specialties?.[0] || 'Expert Coiffure'}
        </Text>
        
        <Text style={[styles.price, { color: colors.primary }]}>
          Dès {(salon as any).min_price || 25}€
        </Text>

        <View style={styles.meta}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {salon.rating > 0 ? salon.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={12} color={colors.textMuted} />
            <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
              {salon.city}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Shared styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontWeight: '700',
  },
  reviewCount: {
    fontWeight: '400',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  location: {
    fontSize: 12,
  },

  // Default card (Style Coiffeur Proximité)
  card: {
    width: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  availableBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardFavoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 30,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  specialty: {
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 11,
    maxWidth: 70,
  },

  // Horizontal card
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    height: 100,
  },
  horizontalImage: {
    width: 100,
    height: '100%',
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniFavorite: {
    padding: 4,
  },
  horizontalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Featured card
  featuredCard: {
    width: width * 0.8,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
});
