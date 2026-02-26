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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/use-salons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Shadows } from '@/constants/theme';
import { salonService } from '@/services/salon.service';
import { SalonCard } from '@/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types de coiffure pour filtres
const HAIRSTYLE_FILTERS = [
  { id: 'all', nameKey: 'common.seeAll', icon: 'grid-outline' },
  { id: 'tresses', nameKey: 'hairstyle.tresses', icon: 'cut-outline' },
  { id: 'locks', nameKey: 'hairstyle.locks', icon: 'ribbon-outline' },
  { id: 'coupe', nameKey: 'hairstyle.coupe', icon: 'cut-outline' },
  { id: 'soins', nameKey: 'hairstyle.soins', icon: 'heart-outline' },
  { id: 'coloration', nameKey: 'hairstyle.coloration', icon: 'color-palette-outline' },
];

// Filtres rapides
const QUICK_FILTERS = [
  { id: 'nearby', nameKey: 'home.nearbyCoiffeurs', icon: 'location' },
  { id: 'rated', nameKey: 'QUICK_FILTERS.rated', icon: 'star' },
  { id: 'available', nameKey: 'QUICK_FILTERS.available', icon: 'time' },
  { id: 'promo', nameKey: 'home.promotions', icon: 'pricetag' },
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
  const { t, language } = useLanguage();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(params.category as string || 'all');
  const [activeRole, setActiveRole] = useState<string | null>(null);

  // Charger le rôle actif au montage
  useEffect(() => {
    const loadRole = async () => {
      const role = await AsyncStorage.getItem('@afroplan_selected_role');
      setActiveRole(role);
    };
    loadRole();
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>(['nearby']);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedMapSalon, setSelectedMapSalon] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState<AdvancedFilters>({
    maxDistance: params.distance ? parseInt(params.distance as string, 10) : 10,
    minRating: 0, // Mis à 0 pour voir les nouveaux salons
    maxPrice: params.budget ? parseInt(params.budget as string, 10) : 300,
    location: (params.location as any) || 'both',
    onlyPromos: false,
  });

  // Memoïser les filtres pour éviter une boucle de re-rendu infinie
  const salonFilters = React.useMemo(() => {
    // Mapping ID technique -> Nom affiché pour la DB
    const categoryMap: Record<string, string> = {
      'tresses': 'Tresses',
      'locks': 'Locks',
      'coupe': 'Coupe',
      'soins': 'Soin',
      'coloration': 'Coloration'
    };
    
    const dbCategory = selectedCategory !== 'all' ? (categoryMap[selectedCategory] || selectedCategory) : undefined;

    return {
      searchQuery: debouncedQuery || undefined,
      category: dbCategory,
      serviceName: params.serviceName as string || undefined,
      city: debouncedQuery.length > 2 ? debouncedQuery : undefined,
      minRating: filters.minRating,
      maxPrice: filters.maxPrice,
    };
  }, [debouncedQuery, selectedCategory, filters.minRating, filters.maxPrice, params.serviceName]);

  // Récupérer les salons réels depuis la base de données
  const { salons: realSalons, isLoading: loadingSalons, refresh } = useSalons(salonFilters);

  // Mettre à jour les filtres si les params changent (uniquement à l'initialisation)
  useEffect(() => {
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category as string);
    }
    if (params.distance || params.budget || params.location) {
      setFilters(prev => ({
        ...prev,
        maxDistance: params.distance ? parseInt(params.distance as string, 10) : prev.maxDistance,
        maxPrice: params.budget ? parseInt(params.budget as string, 10) : prev.maxPrice,
        location: (params.location as any) || prev.location,
      }));
    }
  }, [params.category, params.distance, params.budget, params.location]);

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
    if (Platform.OS === 'web') return;
    
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
        <Text style={[styles.title, { color: colors.text }]}>{t('common.search')}</Text>
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
            placeholder={t('home.searchSubtitle')}
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
                {t(category.nameKey)}
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
                  {filter.id === 'nearby' ? t('home.nearbyCoiffeurs') : 
                   filter.id === 'promo' ? t('home.promotions') : 
                   language === 'fr' ? (filter.id === 'rated' ? 'Mieux notés' : 'Dispo maintenant') : 
                   (filter.id === 'rated' ? 'Top rated' : 'Available now')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {realSalons.length} {language === 'fr' ? 'salons trouvés' : 'salons found'}
        </Text>
        <TouchableOpacity style={styles.sortButton} onPress={refresh}>
          <Ionicons name="refresh" size={16} color="#191919" />
          <Text style={[styles.sortText, { color: '#191919' }]}>{language === 'fr' ? 'Actualiser' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Map placeholder or List */}
      {loadingSalons && realSalons.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>{language === 'fr' ? 'Recherche des salons...' : 'Searching for salons...'}</Text>
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Map Background */}
          <View style={[styles.mapBackground, { backgroundColor: colorScheme === 'dark' ? '#1a2332' : '#e8eedb' }]}>
            {/* User location marker */}
            {userLocation && (
              <View style={[styles.userMarker, { top: '50%', left: '50%' }]}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerDot} />
              </View>
            )}

            {/* Salon markers (Real Data) */}
            {realSalons.map((salon, index) => {
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
                    { top: pos.top as any, left: pos.left as any },
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
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected salon card */}
          {selectedMapSalon && (() => {
            const salon = realSalons.find(s => s.id === selectedMapSalon);
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
                  <Image source={{ uri: salon.cover_image_url || salon.image_url || 'https://via.placeholder.com/300' }} style={styles.mapSalonImage} contentFit="cover" />
                  <View style={styles.mapSalonInfo}>
                    <Text style={[styles.mapSalonName, { color: colors.text }]} numberOfLines={1}>
                      {salon.name}
                    </Text>
                    <View style={styles.mapSalonRating}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.mapSalonRatingText, { color: colors.text }]}>
                        {salon.rating || '0.0'}
                      </Text>
                    </View>
                    <Text style={[styles.mapSalonAddress, { color: colors.textMuted }]} numberOfLines={1}>
                      {salon.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listGrid}
        >
          {loadingSalons && realSalons.length === 0 && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          
          {realSalons.length === 0 && !loadingSalons ? (
            <View style={{ flex: 1, paddingVertical: 100, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={{ marginTop: 16, color: colors.textSecondary }}>
                Aucun salon trouvé dans cette zone.
              </Text>
            </View>
          ) : (
            realSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} variant="default" />
            ))
          )}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>{language === 'fr' ? 'Filtres avancés' : 'Advanced filters'}</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>{language === 'fr' ? 'Réinitialiser' : 'Reset'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Distance */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('geo.maxDistance')}</Text>
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
                <Text style={[styles.filterLabel, { color: colors.text }]}>{language === 'fr' ? 'Note minimum' : 'Minimum rating'}</Text>
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
                <Text style={[styles.filterLabel, { color: colors.text }]}>{t('search.maxBudget')}</Text>
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
              <Text style={[styles.filterLabel, { color: colors.text }]}>{language === 'fr' ? 'Lieu' : 'Location'}</Text>
              <View style={styles.locationOptions}>
                {[
                  { id: 'salon', label: t('search.inSalon'), icon: 'storefront' },
                  { id: 'domicile', label: t('search.atHome'), icon: 'home' },
                  { id: 'both', label: language === 'fr' ? 'Les deux' : 'Both', icon: 'apps' },
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
                  {language === 'fr' ? 'Uniquement les promotions' : 'Promotions only'}
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
              <Text style={styles.applyButtonText}>
                {language === 'fr' ? `Voir ${realSalons.length} résultats` : `See ${realSalons.length} results`}
              </Text>
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
  listGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
