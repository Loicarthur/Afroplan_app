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
// import SearchBar from '@/components/SearchBar'; // à adapter si nécessaire

const { width } = Dimensions.get('window');

/* -------------------- Données mock -------------------- */

const POPULAR_STYLES = [
  { id: '1', name: 'Tresses', icon: '💇🏾‍♀️', color: '#FFE4E6' },
  { id: '2', name: 'Twists', icon: '✨', color: '#FEF3C7' },
  { id: '3', name: 'Natural', icon: '🌸', color: '#FCE7F3' },
  { id: '4', name: 'Locs', icon: '🌺', color: '#DBEAFE' },
];

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

/* -------------------- Screen -------------------- */

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
        {/* ---------------- Header ---------------- */}
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
                <Text style={styles.logoText}>AfroPlan</Text>
                <Text style={styles.logoSubtext}>
                  Trouvez votre style parfait
                </Text>
              </View>
            </View>

            {isAuthenticated ? (
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.authButtons}>
                <TouchableOpacity style={styles.loginButton}>
                  <Text style={styles.loginButtonText}>Connexion</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.registerButton}>
                  <Text style={styles.registerButtonText}>Inscription</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ---------------- Styles populaires ---------------- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Styles populaires
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                Voir tout →
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylesContainer}
          >
            {POPULAR_STYLES.map(style => (
              <TouchableOpacity key={style.id} style={styles.styleItem}>
                <View
                  style={[
                    styles.styleIcon,
                    { backgroundColor: style.color },
                  ]}
                >
                  <Text style={styles.styleEmoji}>{style.icon}</Text>
                </View>
                <Text style={[styles.styleName, { color: colors.text }]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ---------------- Salons recommandés ---------------- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Salons recommandés
          </Text>

          {RECOMMENDED_SALONS.map(salon => (
            <TouchableOpacity
              key={salon.id}
              style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.md]}
              onPress={() => router.push(`/salon/${salon.id}`)}
            >
              <Image source={{ uri: salon.image }} style={styles.salonImage} />

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFF" />
                <Text style={styles.ratingText}>{salon.rating}</Text>
              </View>

              <View style={styles.salonInfo}>
                <Text style={[styles.salonName, { color: colors.text }]}>
                  {salon.name}
                </Text>

                <Text style={styles.salonAddress}>{salon.address}</Text>

                <View style={styles.salonBottom}>
                  <Text style={styles.reviewCount}>
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

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

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
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },

  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },

  logoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  loginButton: {
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  loginButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },

  registerButton: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  registerButtonText: {
    fontWeight: '600',
    color: '#7C3AED',
  },

  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  styleEmoji: { fontSize: 28 },

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
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },

  salonInfo: {
    padding: 16,
  },

  salonName: {
    fontSize: 18,
    fontWeight: '700',
  },

  salonAddress: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  salonBottom: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  specialty: {
    fontSize: 14,
    fontWeight: '500',
  },
});
