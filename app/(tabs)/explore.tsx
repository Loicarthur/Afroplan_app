/**
 * Page Recherche AfroPlan - Design z4
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

// Filtres de recherche
const SEARCH_FILTERS = [
  { id: 'nearby', name: 'Proche de moi', icon: 'location' },
  { id: 'rated', name: 'Mieux notes', icon: 'star-outline' },
  { id: 'available', name: 'Disponible', icon: 'time-outline' },
];

// Donnees de test pour les salons
const SALONS_DATA = [
  {
    id: '1',
    name: 'Bella Coiffure',
    rating: 4.9,
    reviews_count: 234,
    price_level: '€€€',
    address: 'Paris 18e',
    distance: '1.2 km',
    availability: "Aujourd'hui 15h",
    availabilityColor: '#22C55E',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    rating: 4.8,
    reviews_count: 189,
    price_level: '€€',
    address: 'Paris 11e',
    distance: '2.5 km',
    availability: 'Demain 10h',
    availabilityColor: '#F97316',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
  },
  {
    id: '3',
    name: 'Natural Beauty Salon',
    rating: 4.7,
    reviews_count: 156,
    price_level: '€€€',
    address: 'Paris 13e',
    distance: '3.8 km',
    availability: 'Mercredi 14h',
    availabilityColor: '#8B5CF6',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  },
  {
    id: '4',
    name: 'Tresses & Co',
    rating: 4.6,
    reviews_count: 98,
    price_level: '€€',
    address: 'Paris 20e',
    distance: '4.2 km',
    availability: "Aujourd'hui 18h",
    availabilityColor: '#22C55E',
    image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
  },
];

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('nearby');

  const filteredSalons = SALONS_DATA.filter((salon) =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSalonPress = (salonId: string) => {
    router.push(`/salon/${salonId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recherche</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Salon, style, quartier..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="options" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {SEARCH_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === filter.id ? colors.primary : colors.background,
                  borderColor: selectedFilter === filter.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.id ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selectedFilter === filter.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {filteredSalons.length} salons trouves
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={[styles.sortText, { color: colors.primary }]}>Trier par</Text>
        </TouchableOpacity>
      </View>

      {/* Salons List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredSalons.map((salon) => (
          <TouchableOpacity
            key={salon.id}
            style={[styles.salonCard, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => handleSalonPress(salon.id)}
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
                  ({salon.reviews_count})
                </Text>
                <Text style={[styles.separator, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.priceLevel, { color: colors.textMuted }]}>
                  {salon.price_level}
                </Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                  {salon.address}
                </Text>
                <Text style={[styles.distanceText, { color: colors.textMuted }]}>
                  {salon.distance}
                </Text>
              </View>

              <View style={styles.availabilityRow}>
                <Ionicons name="time-outline" size={14} color={salon.availabilityColor} />
                <Text style={[styles.availabilityText, { color: salon.availabilityColor }]}>
                  {salon.availability}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressBar: {
    width: '30%',
    height: '100%',
    borderRadius: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  salonCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 12,
  },
  salonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  salonContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    marginLeft: 2,
  },
  separator: {
    marginHorizontal: 6,
  },
  priceLevel: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    marginLeft: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});
