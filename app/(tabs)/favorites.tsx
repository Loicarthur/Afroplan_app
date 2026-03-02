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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites, useFavoriteStyles } from '@/hooks/use-favorites';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  const { favorites, isLoading: loadingSalons, refresh: refreshSalons, removeFavorite } = useFavorites(user?.id || '');
  const { favoriteStyleIds, isLoading: loadingStyles, refresh: refreshStyles, toggleFavoriteStyle } = useFavoriteStyles(user?.id || '');
  const [refreshing, setRefreshing] = React.useState(false);

  const isLoading = loadingSalons || loadingStyles;

  const allStyles = React.useMemo(() => 
    HAIRSTYLE_CATEGORIES.flatMap(cat => cat.styles), 
  []);

  const favoriteStyles = React.useMemo(() => 
    allStyles.filter(style => favoriteStyleIds.includes(style.id)),
  [allStyles, favoriteStyleIds]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && user?.id) {
        refreshSalons();
        refreshStyles();
      }
    }, [isAuthenticated, user?.id, refreshSalons, refreshStyles])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshSalons(), refreshStyles()]);
    setRefreshing(false);
  }, [refreshSalons, refreshStyles]);

  // Si pas connecté, afficher un écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="heart" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>{t('fav.yourFavorites')}</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            {t('fav.loginMessage')}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.authLink, { color: colors.primary }]}>{t('auth.register')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRemoveSalon = async (salonId: string) => {
    try {
      await removeFavorite(salonId);
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  const handleRemoveStyle = async (styleId: string) => {
    try {
      await toggleFavoriteStyle(styleId);
    } catch (error) {
      console.error('Erreur lors de la suppression du style favori:', error);
    }
  };

  const getCategoryLabel = (styleId: string) => {
    const category = HAIRSTYLE_CATEGORIES.find(cat => 
      cat.styles.some(s => s.id === styleId)
    );
    return category ? category.title : '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* Header simple et élégant */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('fav.favorites')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('fav.favoritesSubtitle')}
          </Text>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Salons Favoris */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('fav.salons')} ({favorites.length})
                </Text>
              </View>

              {favorites.length > 0 ? (
                favorites.map((salon) => (
                  <TouchableOpacity
                    key={salon.id}
                    style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.sm]}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/salon/${salon.id}`)}
                  >
                    <Image 
                      source={salon.image_url ? { uri: salon.image_url } : require('@/assets/images/logo_afroplan.jpeg')} 
                      style={styles.salonImage} 
                      contentFit="cover" 
                    />
                    <View style={styles.salonContent}>
                      <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#FBBF24" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{salon.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={[styles.reviewsText, { color: colors.textMuted }]}>
                          ({salon.reviews_count || 0} {t('salon.reviews').toLowerCase()})
                        </Text>
                      </View>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>{salon.city}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => handleRemoveSalon(salon.id)}
                    >
                      <Ionicons name="heart" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('fav.noFavorites')}
                  </Text>
                </View>
              )}
            </View>

            {/* Styles sauvegardés */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('fav.styles')} ({favoriteStyles.length})
                </Text>
              </View>

              {favoriteStyles.length > 0 ? (
                <View style={styles.stylesGrid}>
                  {favoriteStyles.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.styleCard, { backgroundColor: colors.card }, Shadows.sm]}
                      activeOpacity={0.7}
                      onPress={() => router.push({
                        pathname: '/style-salons/[styleId]',
                        params: { styleId: item.id, styleName: item.name }
                      })}
                    >
                      <View style={styles.styleImageContainer}>
                        <Image source={item.image} style={styles.styleImage} contentFit="cover" />
                        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.categoryText, { color: '#FFFFFF' }]}>
                            {getCategoryLabel(item.id)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.styleRemoveButton}
                          onPress={() => handleRemoveStyle(item.id)}
                        >
                          <Ionicons name="heart" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.styleInfo}>
                        <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.duration && (
                          <Text style={[styles.stylePrice, { color: colors.textSecondary }]}>
                            {item.duration}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="sparkles-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('fav.noStylesSaved') || 'Aucun style sauvegardé'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

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
  styleRemoveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Auth Prompt */
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  authMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  authButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  authLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
