/**
 * Page Recherche AfroPlan - Version Dédiée
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { NativeModules } from 'react-native';
import * as Location from 'expo-location';

let isMapModuleAvailable = false;
try {
  isMapModuleAvailable = !!NativeModules.AirMapModule || !!NativeModules.AirMapManager;
} catch (e) {}

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/use-salons';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import { favoriteService } from '@/services/favorite.service';
import { salonService } from '@/services/salon.service';
import { Colors, Shadows } from '@/constants/theme';
import { SalonCard } from '@/components/ui';
import SearchFlowModal from '@/components/SearchFlowModal';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<MapView>(null);

  // États Recherche
  const [viewMode, setViewMode] = useState<'list' | 'map'>((params.view as any) || 'list');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState((params.city as string) || '');
  const [selectedCategory, setSelectedCategory] = useState((params.category as string) || 'all');

  // États Carte
  const [region, setRegion] = useState<Region | null>(null);
  const [mapSalons, setMapSalons] = useState<any[]>([]);
  const [selectedMapSalon, setSelectedMapSalon] = useState<string | null>(null);

  // Filtres pour le Hook
  const salonFilters = React.useMemo(() => ({
    searchQuery: searchQuery || undefined,
    city: searchQuery || undefined, // On cherche aussi dans le champ ville
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  }), [searchQuery, selectedCategory]);

  const { salons, isLoading, refresh } = useSalons(salonFilters);
  const { favorites, refresh: refreshFavorites } = useFavorites(user?.id || '');
  const favoriteIds = React.useMemo(() => favorites.map(f => f.id), [favorites]);

  // Synchronisation avec les paramètres de navigation
  useEffect(() => {
    if (params.view === 'map') setViewMode('map');
    if (params.city !== undefined) setSearchQuery(params.city as string);
    if (params.category !== undefined) setSelectedCategory(params.category as string);
  }, [params.city, params.category, params.view]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const newRegion = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setRegion(newRegion);
        const results = await salonService.getNearbySalons(loc.coords.latitude, loc.coords.longitude, 10, 20);
        setMapSalons(results);
        if (mapRef.current) mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (viewMode === 'map') requestLocation();
  }, [viewMode]);

  const handleApplySearch = (newF: any) => {
    if (newF.city !== undefined) setSearchQuery(newF.city || '');
    if (newF.hairstyle !== undefined) setSelectedCategory(newF.hairstyle || 'all');
    setSearchModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <SearchFlowModal 
        visible={searchModalVisible} 
        onClose={() => setSearchModalVisible(false)} 
        onSearch={handleApplySearch} 
      />
      
      <View style={styles.header}>
        <View style={styles.searchBarWrapper}>
          <TouchableOpacity style={styles.searchBar} onPress={() => setSearchModalVisible(true)}>
            <Ionicons name="search" size={20} color="#191919" />
            <Text style={styles.searchText} numberOfLines={1}>
              {searchQuery || (selectedCategory !== 'all' ? selectedCategory : "Où voulez-vous vous coiffer ?")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
            <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={24} color="#191919" />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.flex}>
          {isMapModuleAvailable ? (
            <MapView 
              ref={mapRef} 
              style={styles.map} 
              provider={PROVIDER_GOOGLE} 
              initialRegion={region || undefined} 
              showsUserLocation
            >
              {mapSalons.map(s => (
                <Marker 
                  key={s.id} 
                  coordinate={{ latitude: s.latitude, longitude: s.longitude }} 
                  onPress={() => setSelectedMapSalon(s.id)}
                >
                  <View style={[styles.marker, selectedMapSalon === s.id && { backgroundColor: '#191919' }]}>
                    <Ionicons name="cut" size={12} color="#FFF" />
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.center}>
              <Ionicons name="map-outline" size={48} color="#CCC" />
              <Text style={{ marginTop: 10, color: '#888' }}>Carte indisponible (Build natif requis)</Text>
            </View>
          )}
          
          {selectedMapSalon && (() => {
            const s = mapSalons.find(x => x.id === selectedMapSalon);
            return s ? (
              <Animated.View entering={FadeInUp} style={styles.mapCard}>
                <SalonCard 
                  salon={s} 
                  variant="default" 
                  isFavorite={favoriteIds.includes(s.id)} 
                  onFavoritePress={() => handleToggleFavorite(s.id)} 
                />
              </Animated.View>
            ) : null;
          })()}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#191919" style={{ marginTop: 50 }} />
          ) : salons.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconCircle}>
                <Ionicons name="search-outline" size={40} color="#191919" />
              </View>
              <Text style={styles.emptyStateTitle}>Aucun salon trouvé</Text>
              <Text style={styles.emptyStateText}>
                Nous n'avons pas encore de partenaires ici. {"\n"}Essayez une autre ville comme <Text style={styles.emptyStateLink} onPress={() => { setSearchQuery('Paris'); }}>Paris</Text> ou <Text style={styles.emptyStateLink} onPress={() => { setSearchQuery('Champigny'); }}>Champigny</Text> !
              </Text>
              <TouchableOpacity 
                style={styles.resetSearchBtn}
                onPress={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              >
                <Text style={styles.resetSearchBtnText}>Réinitialiser la recherche</Text>
              </TouchableOpacity>
            </View>
          ) : (
            salons.map(s => (
              <SalonCard 
                key={s.id} 
                salon={s} 
                variant="default" 
                isFavorite={favoriteIds.includes(s.id)} 
                onFavoritePress={() => handleToggleFavorite(s.id)} 
              />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12, gap: 10 },
  searchText: { fontSize: 14, fontWeight: '600', color: '#191919', flex: 1 },
  toggleBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  marker: { backgroundColor: '#FF385C', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
  mapCard: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  list: { padding: 16 },
  // Styles pour l'état vide
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyStateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#191919',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#717171',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyStateLink: {
    color: '#191919',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resetSearchBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#191919',
  },
  resetSearchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
});
