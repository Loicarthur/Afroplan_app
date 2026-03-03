/**
 * Page Recherche AfroPlan - Avec filtres avancés et Carte
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { NativeModules } from 'react-native';

// Vérification réelle de la présence du module natif pour éviter le crash invariant
const isMapModuleAvailable = !!NativeModules.AirMapModule || !!NativeModules.AirMapManager || Platform.OS === 'web';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/use-salons';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import { favoriteService } from '@/services/favorite.service';
import { salonService } from '@/services/salon.service';
import { Colors, Shadows } from '@/constants/theme';
import { SalonCard } from '@/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Salon } from '@/types';

const { width } = Dimensions.get('window');

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

const HAIR_TYPES = ['3A', '3B', '3C', '4A', '4B', '4C'];

// Types pour les filtres
interface AdvancedFilters {
  maxDistance: number;
  minRating: number;
  maxPrice: number;
  location: 'salon' | 'domicile' | 'both';
  onlyPromos: boolean;
  hairTypes: string[];
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // États pour la carte
  const [region, setRegion] = useState<Region | null>(null);
  const [mapSalons, setMapSalons] = useState<Salon[]>([]);
  const [isSearchingInArea, setIsSearchingInArea] = useState(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedMapSalon, setSelectedMapSalon] = useState<string | null>(null);
  const [hasInitialRegionSet, setHasInitialRegionSet] = useState(false);

  const [filters, setFilters] = useState<AdvancedFilters>({
    maxDistance: 20,
    minRating: 0,
    maxPrice: 150,
    location: 'both',
    onlyPromos: false,
    hairTypes: [],
  });

  // Synchronisation avec les paramètres de navigation (Home -> Explore)
  useEffect(() => {
    if (params.category) setSelectedCategory(params.category as string);
    if (params.serviceName) setSearchQuery(params.serviceName as string);
    
    setFilters(prev => ({
      ...prev,
      maxPrice: params.budget ? parseInt(params.budget as string, 10) : prev.maxPrice,
      maxDistance: params.distance ? parseInt(params.distance as string, 10) : prev.maxDistance,
      location: (params.location as any) || prev.location,
      hairTypes: params.hairType ? (params.hairType as string).split(',').filter(t => t !== '').map(t => t.toUpperCase()) : prev.hairTypes,
    }));

    // Si on a un salon_id spécifique, on peut passer en mode carte direct
    if (params.salonId) {
      setViewMode('map');
      setSelectedMapSalon(params.salonId as string);
    }
  }, [params.category, params.serviceName, params.budget, params.distance, params.location, params.hairType, params.salonId]);

  // Centrer la carte sur le salon sélectionné
  useEffect(() => {
    if (selectedMapSalon && mapRef.current) {
      const salon = mapSalons.find(s => s.id === selectedMapSalon);
      if (salon && salon.latitude && salon.longitude) {
        mapRef.current.animateToRegion({
          latitude: salon.latitude,
          longitude: salon.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [selectedMapSalon, mapSalons]);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);

  // Memoïser les filtres pour useSalons
  const salonFilters = React.useMemo(() => {
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
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      maxPrice: filters.maxPrice,
    };
  }, [debouncedQuery, selectedCategory, filters.minRating, filters.maxPrice]);

  const { salons: fetchedSalons, isLoading: loadingSalons, refresh } = useSalons(salonFilters);

  // Appliquer les filtres rapides (Quick Filters) sur les données récupérées
  const realSalons = React.useMemo(() => {
    let filtered = [...fetchedSalons];
    
    if (selectedQuickFilters.includes('available')) {
      filtered = filtered.filter(s => !s.is_today_blocked);
    }
    
    if (selectedQuickFilters.includes('promo')) {
      filtered = filtered.filter(s => (s as any).active_promotion_count > 0 || (s as any).has_active_promo);
    }

    if (selectedQuickFilters.includes('rated')) {
      filtered = filtered.filter(s => s.rating >= 4.5);
    }

    return filtered;
  }, [fetchedSalons, selectedQuickFilters]);

  const { favorites, refresh: refreshFavorites } = useFavorites(user?.id || '');
  const favoriteIds = React.useMemo(() => favorites.map(f => f.id), [favorites]);

  const handleToggleFavorite = async (salonId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!user) return;
    try {
      await favoriteService.toggleFavorite(user.id, salonId);
      refreshFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation(location.coords);
        setRegion(newRegion);
        setHasInitialRegionSet(true);
        searchInArea(newRegion);

        // Centrer la carte sur l'utilisateur au premier chargement si pas de salon sélectionné
        if (mapRef.current && !selectedMapSalon) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const searchInArea = async (currentRegion: Region) => {
    setIsSearchingInArea(true);
    setShowSearchAreaButton(false);
    try {
      const radius = Math.max(2, (currentRegion.latitudeDelta * 111) / 2);
      const results = await salonService.getNearbySalons(currentRegion.latitude, currentRegion.longitude, radius, 20);
      setMapSalons(results);
    } catch (error) {
      console.error('Map search error:', error);
    } finally {
      setIsSearchingInArea(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'map' && !hasInitialRegionSet) {
      requestLocationPermission();
    }
  }, [viewMode, hasInitialRegionSet]);

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (viewMode === 'map') setShowSearchAreaButton(true);
  };

  const resetFilters = () => {
    setFilters({
      maxDistance: 20,
      minRating: 0,
      maxPrice: 150,
      location: 'both',
      onlyPromos: false,
      hairTypes: [],
    });
    setSearchQuery('');
    setSelectedCategory('all');
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
          <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color={colors.text} />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
          {HAIRSTYLE_FILTERS.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id ? styles.categoryChipSelected : { backgroundColor: colors.card },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons name={category.icon as any} size={16} color={selectedCategory === category.id ? '#FFFFFF' : colors.text} />
              <Text style={[styles.categoryChipText, { color: selectedCategory === category.id ? '#FFFFFF' : colors.text }]}>
                {t(category.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFiltersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersContainer}>
          {QUICK_FILTERS.map((filter) => {
            const isSelected = selectedQuickFilters.includes(filter.id);
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.quickFilterChip,
                  { backgroundColor: isSelected ? '#191919' : 'transparent', borderColor: isSelected ? '#191919' : colors.border },
                ]}
                onPress={() => setSelectedQuickFilters(prev => isSelected ? prev.filter(id => id !== filter.id) : [...prev, filter.id])}
              >
                <Ionicons name={filter.icon as any} size={14} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.quickFilterText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                  {t(filter.nameKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      {viewMode === 'list' && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: colors.text }]}>
            {realSalons.length} {t('common.results')}
          </Text>
          <TouchableOpacity style={styles.sortButton} onPress={refresh}>
            <Ionicons name="refresh" size={16} color="#191919" />
            <Text style={[styles.sortText, { color: '#191919' }]}>{t('common.refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {MapView ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region || undefined}
              onRegionChangeComplete={onRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {mapSalons.map((salon) => (
                <Marker
                  key={salon.id}
                  coordinate={{ latitude: salon.latitude || 0, longitude: salon.longitude || 0 }}
                  onPress={() => setSelectedMapSalon(salon.id)}
                >
                  <View style={[styles.mapMarkerPin, { backgroundColor: selectedMapSalon === salon.id ? colors.primary : '#191919' }]}>
                    <Ionicons name="cut" size={14} color="#FFFFFF" />
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={[styles.map, styles.center]}>
              <Ionicons name="map-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Carte indisponible (Build natif requis)</Text>
            </View>
          )}
          
          {showSearchAreaButton && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchAreaButtonContainer}>
              <TouchableOpacity style={[styles.searchAreaButton, { backgroundColor: colors.card }]} onPress={() => region && searchInArea(region)}>
                {isSearchingInArea ? <ActivityIndicator size="small" color={colors.primary} /> : <><Ionicons name="refresh" size={16} color={colors.primary} /><Text style={[styles.searchAreaButtonText, { color: colors.text }]}>Rechercher dans cette zone</Text></>}
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity style={[styles.mapRecenterButton, { backgroundColor: colors.card }]} onPress={requestLocationPermission}>
            <Ionicons name="locate" size={24} color={colors.text} />
          </TouchableOpacity>

          {selectedMapSalon && (() => {
            const salon = mapSalons.find(s => s.id === selectedMapSalon);
            if (!salon) return null;
            return (
              <Animated.View entering={FadeInUp} style={[styles.mapSalonCard, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={styles.mapSalonCardContent} onPress={() => router.push(`/salon/${salon.id}`)}>
                  <Image source={{ uri: salon.cover_image_url || salon.image_url }} style={styles.mapSalonImage} contentFit="cover" />
                  <View style={styles.mapSalonInfo}>
                    <Text style={[styles.mapSalonName, { color: colors.text }]} numberOfLines={1}>{salon.name}</Text>
                    <View style={styles.mapSalonRating}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.mapSalonRatingText, { color: colors.text }]}>{salon.rating || '0.0'}</Text>
                    </View>
                    <Text style={[styles.mapSalonAddress, { color: colors.textMuted }]} numberOfLines={1}>{salon.address}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listGrid}>
          {loadingSalons && fetchedSalons.length === 0 ? (
            <View style={{ flex: 1, paddingVertical: 100, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : realSalons.length === 0 ? (
            <View style={{ flex: 1, paddingVertical: 100, alignItems: 'center', width: '100%' }}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={{ marginTop: 16, color: colors.textSecondary }}>{t('common.noResults')}</Text>
            </View>
          ) : (
            realSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} isFavorite={favoriteIds.includes(salon.id)} onFavoritePress={() => handleToggleFavorite(salon.id)} />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Advanced Filters Modal */}
      <Modal visible={showFiltersModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtres avancés</Text>
            <TouchableOpacity onPress={resetFilters}><Text style={styles.resetText}>Réinitialiser</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Budget */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Budget maximum</Text>
                <Text style={[styles.filterValue, { color: colors.primary }]}>{filters.maxPrice} €</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={500}
                step={10}
                value={filters.maxPrice}
                onValueChange={(v) => setFilters(f => ({ ...f, maxPrice: v }))}
                minimumTrackTintColor={colors.primary}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Distance */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Distance maximale</Text>
                <Text style={[styles.filterValue, { color: colors.primary }]}>{filters.maxDistance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={filters.maxDistance}
                onValueChange={(v) => setFilters(f => ({ ...f, maxDistance: v }))}
                minimumTrackTintColor={colors.primary}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Type de cheveux */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text, marginBottom: 12 }]}>Type de cheveux</Text>
              <View style={styles.hairTypeGrid}>
                {HAIR_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.hairTypeChip, filters.hairTypes.includes(type) ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setFilters(f => ({ ...f, hairTypes: f.hairTypes.includes(type) ? f.hairTypes.filter(t => t !== type) : [...f.hairTypes, type] }))}
                  >
                    <Text style={{ color: filters.hairTypes.includes(type) ? '#FFF' : colors.text }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lieu */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text, marginBottom: 12 }]}>Lieu de prestation</Text>
              <View style={styles.locationOptions}>
                {[
                  { id: 'salon', label: 'Salon', icon: 'storefront' },
                  { id: 'domicile', label: 'Domicile', icon: 'home' },
                  { id: 'both', label: 'Peu importe', icon: 'options' }
                ].map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.locationOption, filters.location === loc.id ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setFilters(f => ({ ...f, location: loc.id as any }))}
                  >
                    <Ionicons name={loc.icon as any} size={20} color={filters.location === loc.id ? '#FFF' : colors.text} />
                    <Text style={[styles.locationOptionText, { color: filters.location === loc.id ? '#FFF' : colors.text }]}>{loc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: '#191919' }]} onPress={() => setShowFiltersModal(false)}>
              <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  viewModeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  filterButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryWrapper: { marginBottom: 12 },
  categoryContainer: { paddingHorizontal: 20, gap: 10 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6 },
  categoryChipSelected: { backgroundColor: '#191919' },
  categoryChipText: { fontSize: 13, fontWeight: '500' },
  quickFiltersWrapper: { marginBottom: 12 },
  quickFiltersContainer: { paddingHorizontal: 20, gap: 8 },
  quickFilterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, gap: 4 },
  quickFilterText: { fontSize: 12, fontWeight: '500' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  resultsCount: { fontSize: 15, fontWeight: '600' },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 14, fontWeight: '500' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  searchAreaButtonContainer: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  searchAreaButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 8, ...Shadows.md },
  searchAreaButtonText: { fontSize: 13, fontWeight: '600' },
  mapRecenterButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...Shadows.md, zIndex: 10 },
  mapMarkerPin: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  mapSalonCard: { position: 'absolute', bottom: 16, left: 16, right: 16, borderRadius: 16, ...Shadows.lg, zIndex: 20 },
  mapSalonCardContent: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  mapSalonImage: { width: 64, height: 64, borderRadius: 12 },
  mapSalonInfo: { flex: 1, marginLeft: 12 },
  mapSalonName: { fontSize: 15, fontWeight: '600' },
  mapSalonRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  mapSalonRatingText: { fontSize: 13, fontWeight: '600' },
  mapSalonAddress: { fontSize: 12, marginTop: 2 },
  listGrid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  resetText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  modalContent: { flex: 1, padding: 20 },
  filterSection: { marginBottom: 28 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontSize: 16, fontWeight: '600' },
  filterValue: { fontSize: 16, fontWeight: '700' },
  slider: { width: '100%', height: 40 },
  hairTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hairTypeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  locationOptions: { flexDirection: 'row', gap: 12 },
  locationOption: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, gap: 8, borderWidth: 2 },
  locationOptionText: { fontSize: 12, fontWeight: '500' },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  applyButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
