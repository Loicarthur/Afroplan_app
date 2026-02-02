/**
 * Page d'accueil AfroPlan
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { usePopularSalons, useCategories } from '@/hooks/use-salons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { SearchBar, SalonCard, CategoryCard } from '@/components/ui';
import { Category } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, isAuthenticated } = useAuth();
  const { salons: popularSalons, isLoading: loadingSalons, error: salonsError } = usePopularSalons(6);
  const { categories, isLoading: loadingCategories } = useCategories();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSearchPress = () => {
    router.push('/(tabs)/explore');
  };

  const handleCategoryPress = (category: Category) => {
    router.push(`/(tabs)/explore?category=${category.slug}`);
  };

  const handleSeeAllSalons = () => {
    router.push('/(tabs)/explore');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {isAuthenticated && profile?.full_name
                ? profile.full_name
                : 'Bienvenue sur AfroPlan'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.9}>
            <View pointerEvents="none">
              <SearchBar
                placeholder="Rechercher un salon, un style..."
                showFilterButton={false}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={[styles.banner, { backgroundColor: colors.primary }]}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                Trouvez votre coiffeur Afro ideal
              </Text>
              <Text style={styles.bannerSubtitle}>
                Des milliers de salons pres de chez vous
              </Text>
              <TouchableOpacity
                style={[styles.bannerButton, { backgroundColor: colors.accent }]}
                onPress={handleSeeAllSalons}
              >
                <Text style={styles.bannerButtonText}>Explorer</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.bannerImage}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Categories
            </Text>
          </View>
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
            </View>
          ) : categories.length > 0 ? (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <CategoryCard
                  category={item}
                  onPress={handleCategoryPress}
                  variant="compact"
                />
              )}
            />
          ) : (
            <View style={styles.placeholderCategories}>
              {['Tresses', 'Locks', 'Coupe', 'Coloration', 'Soins'].map((name, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.placeholderCategory, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => router.push('/(tabs)/explore')}
                >
                  <View style={[styles.placeholderIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.placeholderCategoryName, { color: colors.text }]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Popular Salons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Salons populaires
            </Text>
            <TouchableOpacity onPress={handleSeeAllSalons}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {loadingSalons ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: colors.textSecondary }}>Chargement des salons...</Text>
            </View>
          ) : salonsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                Configurez votre backend Supabase pour voir les salons
              </Text>
            </View>
          ) : popularSalons.length > 0 ? (
            <FlatList
              data={popularSalons}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.salonsList}
              renderItem={({ item }) => (
                <SalonCard salon={item} variant="featured" />
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun salon disponible pour le moment
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="location-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Pres de moi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Reservations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push('/(tabs)/favorites')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.error }]}>
                <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Favoris
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSizes.md,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  bannerContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  banner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  bannerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.md,
  },
  bannerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  bannerImage: {
    width: 80,
    height: 80,
    opacity: 0.8,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
  },
  salonsList: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  placeholderCategories: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  placeholderCategory: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderCategoryName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
