/**
 * Page Recherche AfroPlan - Avec filtres avancés
 * Préparé pour intégration Google Maps
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// Types de coiffure pour filtres
const HAIRSTYLE_FILTERS = [
  { id: 'all', name: 'Tous', icon: 'grid-outline' },
  { id: 'tresses', name: 'Tresses', icon: 'cut-outline' },
  { id: 'locks', name: 'Locks', icon: 'ribbon-outline' },
  { id: 'coupe', name: 'Coupe', icon: 'scissors-outline' },
  { id: 'soins', name: 'Soins', icon: 'heart-outline' },
  { id: 'coloration', name: 'Coloration', icon: 'color-palette-outline' },
];

// Filtres rapides
const QUICK_FILTERS = [
  { id: 'nearby', name: 'Proche de moi', icon: 'location' },
  { id: 'rated', name: 'Mieux notés', icon: 'star' },
  { id: 'available', name: 'Dispo maintenant', icon: 'time' },
  { id: 'promo', name: 'Promos', icon: 'pricetag' },
];

// Données de test pour les salons
const SALONS_DATA = [
  {
    id: '1',
    name: 'Bella Coiffure',
    rating: 4.9,
    reviews_count: 234,
    price_level: '€€€',
    address: '12 Rue des Martyrs, Paris 18e',
    distance: '1.2 km',
    availability: "Aujourd'hui 15h",
    availabilityColor: '#22C55E',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    services: ['Tresses', 'Twists', 'Coloration'],
    minPrice: 45,
    hasPromo: true,
    promoText: '-20%',
    latitude: 48.8825,
    longitude: 2.3383,
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    rating: 4.8,
    reviews_count: 189,
    price_level: '€€',
    address: '8 Boulevard Voltaire, Paris 11e',
    distance: '2.5 km',
    availability: 'Demain 10h',
    availabilityColor: '#4A4A4A',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
    services: ['Locs', 'Coupe homme', 'Entretien'],
    minPrice: 30,
    hasPromo: false,
    promoText: '',
    latitude: 48.8619,
    longitude: 2.3700,
  },
  {
    id: '3',
    name: 'Natural Beauty Salon',
    rating: 4.7,
    reviews_count: 156,
    price_level: '€€€',
    address: '45 Avenue d\'Italie, Paris 13e',
    distance: '3.8 km',
    availability: 'Mercredi 14h',
    availabilityColor: '#191919',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    services: ['Soins', 'Hydratation', 'Coupe'],
    minPrice: 35,
    hasPromo: true,
    promoText: '-15%',
    latitude: 48.8322,
    longitude: 2.3561,
  },
  {
    id: '4',
    name: 'Tresses & Co',
    rating: 4.6,
    reviews_count: 98,
    price_level: '€€',
    address: '23 Rue de Bagnolet, Paris 20e',
    distance: '4.2 km',
    availability: "Aujourd'hui 18h",
    availabilityColor: '#22C55E',
    image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
    services: ['Tresses', 'Cornrows', 'Box braids'],
    minPrice: 50,
    hasPromo: false,
    promoText: '',
    latitude: 48.8566,
    longitude: 2.3988,
  },
];

// Types pour les filtres
interface AdvancedFilters {
  maxDistance: number;
  minRating: number;
  maxPrice: number;
  location: 'salon' | 'domicile' | 'both';
  onlyPromos: boolean;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>(['nearby']);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedMapSalon, setSelectedMapSalon] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState<AdvancedFilters>({
    maxDistance: 10,
    minRating: 4.0,
    maxPrice: 200,
    location: 'both',
    onlyPromos: false,
  });

  // Filtrer les salons
  const filteredSalons = SALONS_DATA.filter((salon) => {
    const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDistance = parseFloat(salon.distance) <= filters.maxDistance;
    const matchesRating = salon.rating >= filters.minRating;
    const matchesPrice = salon.minPrice <= filters.maxPrice;
    const matchesPromo = !filters.onlyPromos || salon.hasPromo;

    return matchesSearch && matchesDistance && matchesRating && matchesPrice && matchesPromo;
  });

  const toggleQuickFilter = (filterId: string) => {
    setSelectedQuickFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSalonPress = (salonId: string) => {
    router.push(`/salon/${salonId}`);
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      if (__DEV__) console.warn('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'map' && !userLocation) {
      requestLocationPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const openDirections = (latitude: number, longitude: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${name}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${name})`,
      default: `https://maps.google.com/?q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const resetFilters = () => {
    setFilters({
      maxDistance: 10,
      minRating: 4.0,
      maxPrice: 200,
      location: 'both',
      onlyPromos: false,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recherche</Text>
        <TouchableOpacity
          style={[styles.viewModeButton, { backgroundColor: colors.card }]}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons
            name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Salon, coiffeur, style..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: '#191919' }]}
          onPress={() => setShowFiltersModal(true)}
        >
          <Ionicons name="options" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {HAIRSTYLE_FILTERS.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id
                  ? styles.categoryChipSelected
                  : { backgroundColor: colors.card },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === category.id ? '#FFFFFF' : colors.text },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFiltersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}
        >
          {QUICK_FILTERS.map((filter) => {
            const isSelected = selectedQuickFilters.includes(filter.id);
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.quickFilterChip,
                  {
                    backgroundColor: isSelected ? '#191919' : 'transparent',
                    borderColor: isSelected ? '#191919' : colors.border,
                  },
                ]}
                onPress={() => toggleQuickFilter(filter.id)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.quickFilterText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {filteredSalons.length} salon{filteredSalons.length > 1 ? 's' : ''} trouvé{filteredSalons.length > 1 ? 's' : ''}
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={[styles.sortText, { color: '#191919' }]}>Trier par</Text>
          <Ionicons name="chevron-down" size={16} color="#191919" />
        </TouchableOpacity>
      </View>

      {/* Map placeholder or List */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Map Background */}
          <View style={[styles.mapBackground, { backgroundColor: colorScheme === 'dark' ? '#1a2332' : '#e8eedb' }]}>
            {/* Grid lines for map feel */}
            {[...Array(8)].map((_, i) => (
              <View
                key={`h-${i}`}
                style={[styles.mapGridLine, styles.mapGridHorizontal, { top: `${(i + 1) * 12.5}%`, backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}
              />
            ))}
            {[...Array(6)].map((_, i) => (
              <View
                key={`v-${i}`}
                style={[styles.mapGridLine, styles.mapGridVertical, { left: `${(i + 1) * 16.6}%`, backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}
              />
            ))}

            {/* User location marker */}
            {userLocation && (
              <View style={[styles.userMarker, { top: '50%', left: '50%' }]}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerDot} />
              </View>
            )}

            {locationLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.mapLoadingText, { color: colors.text }]}>
                  Localisation...
                </Text>
              </View>
            )}

            {/* Salon markers */}
            {filteredSalons.map((salon, index) => {
              const positions = [
                { top: '25%' as const, left: '30%' as const },
                { top: '35%' as const, left: '65%' as const },
                { top: '60%' as const, left: '20%' as const },
                { top: '55%' as const, left: '75%' as const },
              ];
              const pos = positions[index % positions.length];

              return (
                <TouchableOpacity
                  key={salon.id}
                  style={[
                    styles.mapMarker,
                    { top: pos.top as `${number}%`, left: pos.left as `${number}%` },
                    selectedMapSalon === salon.id && styles.mapMarkerSelected,
                  ]}
                  onPress={() => setSelectedMapSalon(selectedMapSalon === salon.id ? null : salon.id)}
                >
                  <View style={[
                    styles.mapMarkerPin,
                    { backgroundColor: selectedMapSalon === salon.id ? colors.primary : '#191919' },
                  ]}>
                    <Ionicons name="cut" size={14} color="#FFFFFF" />
                  </View>
                  <View style={[
                    styles.mapMarkerLabel,
                    { backgroundColor: selectedMapSalon === salon.id ? colors.primary : colors.card },
                  ]}>
                    <Text style={[
                      styles.mapMarkerPrice,
                      { color: selectedMapSalon === salon.id ? '#FFFFFF' : colors.text },
                    ]} numberOfLines={1}>
                      {salon.minPrice} EUR
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected salon card */}
          {selectedMapSalon && (() => {
            const salon = filteredSalons.find(s => s.id === selectedMapSalon);
            if (!salon) return null;
            return (
              <Animated.View
                entering={FadeInUp.duration(300)}
                style={[styles.mapSalonCard, { backgroundColor: colors.card }]}
              >
                <TouchableOpacity
                  style={styles.mapSalonCardContent}
                  onPress={() => handleSalonPress(salon.id)}
                >
                  <Image source={{ uri: salon.image }} style={styles.mapSalonImage} contentFit="cover" />
                  <View style={styles.mapSalonInfo}>
                    <Text style={[styles.mapSalonName, { color: colors.text }]} numberOfLines={1}>
                      {salon.name}
                    </Text>
                    <View style={styles.mapSalonRating}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.mapSalonRatingText, { color: colors.text }]}>
                        {salon.rating}
                      </Text>
                      <Text style={[styles.mapSalonReviews, { color: colors.textMuted }]}>
                        ({salon.reviews_count})
                      </Text>
                    </View>
                    <Text style={[styles.mapSalonAddress, { color: colors.textMuted }]} numberOfLines={1}>
                      {salon.address}
                    </Text>
                    <Text style={[styles.mapSalonDistance, { color: colors.primary }]}>
                      {salon.distance}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.mapDirectionsButton, { backgroundColor: colors.primary }]}
                    onPress={() => openDirections(salon.latitude, salon.longitude, salon.name)}
                  >
                    <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Recenter button */}
          <TouchableOpacity
            style={[styles.mapRecenterButton, { backgroundColor: colors.card }]}
            onPress={requestLocationPermission}
          >
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {filteredSalons.map((salon, index) => (
            <Animated.View
              key={salon.id}
              entering={FadeInUp.delay(index * 100).duration(400)}
            >
              <TouchableOpacity
                style={[styles.salonCard, { backgroundColor: colors.card }]}
                onPress={() => handleSalonPress(salon.id)}
              >
                <View style={styles.salonImageContainer}>
                  <Image
                    source={{ uri: salon.image }}
                    style={styles.salonImage}
                    contentFit="cover"
                  />
                  {salon.hasPromo && (
                    <View style={styles.promoBadge}>
                      <Text style={styles.promoBadgeText}>{salon.promoText}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.salonContent}>
                  <View style={styles.salonHeader}>
                    <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{salon.rating}</Text>
                    </View>
                  </View>

                  <Text style={[styles.servicesText, { color: colors.textSecondary }]}>
                    {salon.services.join(' • ')}
                  </Text>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={1}>
                      {salon.address}
                    </Text>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{salon.distance}</Text>
                    </View>
                  </View>

                  <View style={styles.salonFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceLabel, { color: colors.textMuted }]}>À partir de</Text>
                      <Text style={[styles.priceValue, { color: '#7C3AED' }]}>{salon.minPrice}€</Text>
                    </View>

                    <View style={[
                      styles.availabilityBadge,
                      { backgroundColor: salon.availabilityColor + '20' }
                    ]}>
                      <Ionicons name="time" size={12} color={salon.availabilityColor} />
                      <Text style={[styles.availabilityText, { color: salon.availabilityColor }]}>
                        {salon.availability}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtres avancés</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Distance */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Distance maximum</Text>
                <Text style={[styles.filterValue, { color: '#191919' }]}>{filters.maxDistance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={filters.maxDistance}
                onValueChange={(value) => setFilters({ ...filters, maxDistance: value })}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
            </View>

            {/* Rating */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Note minimum</Text>
                <View style={styles.ratingDisplay}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.filterValue, { color: '#191919' }]}>{filters.minRating.toFixed(1)}</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3.0}
                maximumValue={5.0}
                step={0.1}
                value={filters.minRating}
                onValueChange={(value) => setFilters({ ...filters, minRating: value })}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
            </View>

            {/* Max Price */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Budget maximum</Text>
                <Text style={[styles.filterValue, { color: '#191919' }]}>{filters.maxPrice}€</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={300}
                step={10}
                value={filters.maxPrice}
                onValueChange={(value) => setFilters({ ...filters, maxPrice: value })}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
            </View>

            {/* Location Type */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Lieu</Text>
              <View style={styles.locationOptions}>
                {[
                  { id: 'salon', label: 'En salon', icon: 'storefront' },
                  { id: 'domicile', label: 'À domicile', icon: 'home' },
                  { id: 'both', label: 'Les deux', icon: 'apps' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.locationOption,
                      { backgroundColor: colors.card },
                      filters.location === option.id && styles.locationOptionSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, location: option.id as any })}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={filters.location === option.id ? '#FFFFFF' : colors.text}
                    />
                    <Text
                      style={[
                        styles.locationOptionText,
                        { color: filters.location === option.id ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Only Promos */}
            <TouchableOpacity
              style={[styles.promoToggle, { backgroundColor: colors.card }]}
              onPress={() => setFilters({ ...filters, onlyPromos: !filters.onlyPromos })}
            >
              <View style={styles.promoToggleContent}>
                <Ionicons name="pricetag" size={20} color="#7C3AED" />
                <Text style={[styles.promoToggleText, { color: colors.text }]}>
                  Uniquement les promotions
                </Text>
              </View>
              <View style={[
                styles.toggle,
                filters.onlyPromos && styles.toggleActive,
              ]}>
                <View style={[
                  styles.toggleThumb,
                  filters.onlyPromos && styles.toggleThumbActive,
                ]} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.applyButtonText}>Voir {filteredSalons.length} résultats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  categoryWrapper: {
    marginBottom: 12,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#191919',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickFiltersWrapper: {
    marginBottom: 12,
  },
  quickFiltersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridLine: {
    position: 'absolute',
  },
  mapGridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  mapGridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  mapLoadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  userMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: -12,
    zIndex: 10,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  mapMarkerSelected: {
    zIndex: 15,
  },
  mapMarkerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapMarkerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapMarkerPrice: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapSalonCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  mapSalonCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  mapSalonImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  mapSalonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mapSalonName: {
    fontSize: 15,
    fontWeight: '600',
  },
  mapSalonRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mapSalonRatingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mapSalonReviews: {
    fontSize: 12,
  },
  mapSalonAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  mapSalonDistance: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mapDirectionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  mapRecenterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  salonCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  salonImageContainer: {
    position: 'relative',
  },
  salonImage: {
    width: 100,
    height: 130,
  },
  promoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  salonContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  salonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  servicesText: {
    fontSize: 12,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
  },
  distanceBadge: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  salonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  locationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  locationOption: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationOptionSelected: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  locationOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  promoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  promoToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoToggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#22C55E',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  applyButton: {
    backgroundColor: '#191919',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
