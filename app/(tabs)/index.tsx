/**
 * Page d'accueil AfroPlan - Design z1
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Donnees de test pour les styles populaires
const POPULAR_STYLES = [
  { id: '1', name: 'Tresses', icon: '💇🏾‍♀️', color: '#FFE4E6' },
  { id: '2', name: 'Twists', icon: '✨', color: '#FEF3C7' },
  { id: '3', name: 'Natural', icon: '🌸', color: '#FCE7F3' },
  { id: '4', name: 'Locs', icon: '🌺', color: '#DBEAFE' },
];

// Donnees de test pour les salons recommandes
const RECOMMENDED_SALONS = [
  {
    id: '1',
    name: 'Bella Coiffure',
    address: 'Paris 18e',
    rating: 4.9,
    reviews_count: 234,
    specialty: 'Box Braids',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    address: 'Paris 11e',
    rating: 4.8,
    reviews_count: 189,
    specialty: 'Twists',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
  },
  {
    id: '3',
    name: 'Natural Beauty Salon',
    address: 'Paris 13e',
    rating: 4.7,
    reviews_count: 156,
    specialty: 'Natural Hair',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = React.useState(false);
  const [location, setLocation] = React.useState('Paris, France');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSearchPress = () => {
    router.push('/(tabs)/explore');
  };

  const handleSalonPress = (salonId: string) => {
    router.push(`/salon/${salonId}`);
  };

  const handleSeeAllStyles = () => {
    router.push('/(tabs)/bookings');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ backgroundColor: colors.background }}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
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
                <Text style={styles.logoText}>Afro'Planet</Text>
                <Text style={styles.logoSubtext}>Trouvez votre style parfait</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={handleSearchPress}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Rechercher un salon ou un style...</Text>
          </TouchableOpacity>

          {/* Location */}
          <View style={styles.locationContainer}>
            <View style={styles.locationLeft}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeText}>Changer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Styles Populaires */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Styles Populaires
            </Text>
            <TouchableOpacity onPress={handleSeeAllStyles}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylesContainer}
          >
            {POPULAR_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={styles.styleItem}
                onPress={() => router.push('/(tabs)/bookings')}
              >
                <View style={[styles.styleIcon, { backgroundColor: style.color }]}>
                  <Text style={styles.styleEmoji}>{style.icon}</Text>
                </View>
                <Text style={[styles.styleName, { color: colors.text }]}>{style.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Salons Recommandes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Salons Recommandes
            </Text>
            <TouchableOpacity>
              <Ionicons name="star" size={20} color="#FBBF24" />
            </TouchableOpacity>
          </View>

          {RECOMMENDED_SALONS.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.md]}
              onPress={() => handleSalonPress(salon.id)}
            >
              <Image
                source={{ uri: salon.image }}
                style={styles.salonImage}
                contentFit="cover"
              />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.ratingText}>{salon.rating}</Text>
              </View>
              <View style={styles.salonInfo}>
                <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                <View style={styles.salonLocation}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.salonAddress, { color: colors.textSecondary }]}>
                    {salon.address}
                  </Text>
                </View>
                <View style={styles.salonBottom}>
                  <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                    {salon.reviews_count} avis
                  </Text>
                  <Text style={[styles.specialty, { color: colors.primary }]}>
                    {salon.specialty}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: '#9CA3AF',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
  },
  changeText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
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
  stylesContainer: {
    paddingRight: 20,
  },
  styleItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  styleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  styleEmoji: {
    fontSize: 28,
  },
  styleName: {
    fontSize: 12,
    fontWeight: '500',
  },
  salonCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  salonImage: {
    width: '100%',
    height: 180,
  },
  ratingBadge: {
    position: 'absolute',
    top: 150,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  salonInfo: {
    padding: 16,
  },
  salonName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  salonLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  salonAddress: {
    marginLeft: 4,
    fontSize: 14,
  },
  salonBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 12,
  },
  specialty: {
    fontSize: 14,
    fontWeight: '500',
  },
});
