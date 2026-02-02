/**
 * Page Explorer / Recherche de salons AfroPlan
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSalons, useSearchSalons, useCategories } from '@/hooks/use-salons';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { SearchBar, SalonCard, CategoryCard } from '@/components/ui';
import { Salon, Category, SalonFilters } from '@/types';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ category?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    params.category
  );
  const [showFilters, setShowFilters] = useState(false);

  const filters: SalonFilters = {
    category: selectedCategory,
    searchQuery: searchQuery || undefined,
  };

  const { salons, isLoading, error, hasMore, loadMore, refresh } = useSalons(filters);
  const { results: searchResults, isLoading: searching, search, clear } = useSearchSalons();
  const { categories } = useCategories();

  const displayedSalons = searchQuery.length > 2 ? searchResults : salons;

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      search(text);
    } else {
      clear();
    }
  }, [search, clear]);

  const handleCategoryPress = (category: Category) => {
    if (selectedCategory === category.slug) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(category.slug);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
    clear();
  };

  const renderSalonItem = ({ item }: { item: Salon }) => (
    <View style={styles.salonItem}>
      <SalonCard salon={item} variant="horizontal" />
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === item.slug
                        ? colors.primary
                        : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => handleCategoryPress(item)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === item.slug
                          ? '#FFFFFF'
                          : colors.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Active Filters */}
      {(selectedCategory || searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
            Filtres actifs:
          </Text>
          {selectedCategory && (
            <View style={[styles.filterTag, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterTagText}>{selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(undefined)}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={[styles.clearFilters, { color: colors.error }]}>
              Tout effacer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {displayedSalons.length} salon{displayedSalons.length !== 1 ? 's' : ''} trouve
          {displayedSalons.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Aucun salon trouve
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {error
          ? 'Configurez votre backend Supabase pour voir les salons'
          : 'Essayez de modifier vos criteres de recherche'}
      </Text>
      {(selectedCategory || searchQuery) && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.primary }]}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearButtonText}>Effacer les filtres</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || isLoading) return null;
    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { borderColor: colors.border }]}
        onPress={loadMore}
      >
        <Text style={[styles.loadMoreText, { color: colors.primary }]}>
          Charger plus
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Trouvez le salon parfait pour vous
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Rechercher un salon, une ville..."
          value={searchQuery}
          onChangeText={handleSearch}
          showFilterButton
          onFilterPress={() => setShowFilters(!showFilters)}
        />
      </View>

      {/* Salons List */}
      {isLoading && displayedSalons.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Recherche des salons...
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedSalons}
          keyExtractor={(item) => item.id}
          renderItem={renderSalonItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={isLoading && displayedSalons.length > 0}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  categoriesSection: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  activeFiltersText: {
    fontSize: FontSizes.sm,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  filterTagText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
  },
  clearFilters: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultsCount: {
    fontSize: FontSizes.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  salonItem: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  clearButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadMoreButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadMoreText: {
    fontWeight: '600',
  },
});
