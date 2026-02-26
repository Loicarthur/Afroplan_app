/**
 * Écran Découvrir AfroPlan — Style Airbnb
 * Barre filtre images + filtres pills (distance, prix, lieu) + cartes listing
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/theme';
import { AuthGuardModal, SalonCard } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { useSalons } from '@/hooks/use-salons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from '@/components/NotificationModal';

const { width } = Dimensions.get('window');

/* ── Catégories pour la barre de filtres ── */
const FILTER_CATEGORIES = [
  { id: 'all', title: 'Tout', emoji: '✨', image: null as any },
  ...HAIRSTYLE_CATEGORIES.map((cat) => ({
    id: cat.id,
    title: cat.title,
    emoji: cat.emoji,
    image: cat.styles[0]?.image ?? null,
  })),
];

interface AdvancedFilters {
  maxDistance: number;
  maxPrice: number;
  minRating: number;
  location: 'salon' | 'domicile' | 'both';
}

const DEFAULT_FILTERS: AdvancedFilters = {
  maxDistance: 10,
  maxPrice: 200,
  minRating: 0,
  location: 'both',
};

/* ─────────────────────────────────────── */

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { showAuthModal, setShowAuthModal } = useAuthGuard();
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userCity, setUserCity] = useState('Paris, France');
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  /* ── Debounce recherche ── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ── Mapping catégorie → DB ── */
  const salonFilters = React.useMemo(() => {
    const categoryMap: Record<string, string> = {
      'tresses-nattes': 'Tresses',
      'vanilles-twists': 'Vanilles',
      'locks': 'Locks',
      'boucles-ondulations': 'Boucles',
      'tissages-perruques': 'Tissage',
      'ponytail': 'Ponytail',
      'coupe-restructuration': 'Coupe',
      'soins-lissage-coloration': 'Soins',
    };
    return {
      searchQuery: debouncedQuery || undefined,
      category: selectedCategory !== 'all' ? (categoryMap[selectedCategory] || undefined) : undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
    };
  }, [debouncedQuery, selectedCategory, filters.minRating, filters.maxPrice]);

  const { salons, isLoading, refresh } = useSalons(salonFilters);

  /* ── Bookings actifs ── */
  const fetchActiveBookingsCount = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const { bookingService } = await import('@/services/booking.service');
        const response = await bookingService.getClientBookings(user.id);
        const count = response.data.filter(
          (b: any) => b.status === 'pending' || b.status === 'confirmed'
        ).length;
        setActiveBookingsCount(count);
      } catch {
        setActiveBookingsCount(0);
      }
    }
  }, [isAuthenticated, user]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveBookingsCount();
      refresh();
    }, [fetchActiveBookingsCount, refresh])
  );

  /* ── Géolocalisation ville ── */
  const getUserCity = async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const [result] = await Location.reverseGeocodeAsync(loc.coords);
        if (result) {
          const city = result.city || result.district || result.subregion || '';
          const country = result.country || '';
          if (city) setUserCity(`${city}, ${country}`);
        }
      }
    } catch {}
  };

  const handleSwitchToCoiffeur = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'coiffeur');
    router.replace('/(coiffeur)');
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const activeFiltersCount = [
    filters.maxDistance !== DEFAULT_FILTERS.maxDistance,
    filters.maxPrice !== DEFAULT_FILTERS.maxPrice,
    filters.minRating > 0,
    filters.location !== 'both',
  ].filter(Boolean).length;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/logo_afroplan.jpeg')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        {/* Pill localisation */}
        <TouchableOpacity
          style={[styles.locationPill, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={getUserCity}
        >
          <Ionicons name="location" size={13} color="#191919" />
          <Text style={[styles.locationPillText, { color: colors.text }]} numberOfLines={1}>
            {userCity}
          </Text>
          <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Icônes droite */}
        <View style={styles.headerRight}>
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/reservations')}
              >
                <Ionicons name="chatbubble-outline" size={19} color={colors.text} />
                {activeBookingsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeBookingsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.card }]}
                onPress={() => setNotificationModalVisible(true)}
              >
                <Ionicons name="notifications-outline" size={19} color={colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() =>
                  router.push({ pathname: '/(auth)/login', params: { role: 'client' } })
                }
              >
                <Text style={styles.loginButtonText}>Connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchToCoiffeur}>
                <Ionicons name="swap-horizontal" size={18} color="#191919" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Barre de recherche ── */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={language === 'fr' ? 'Salon, coiffeur, quartier...' : 'Salon, hairdresser, area...'}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Barre filtre avec images (style Airbnb) ── */}
      <View style={[styles.categorySection, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={[styles.categoryImageWrapper, isActive && styles.categoryImageWrapperActive]}>
                  {cat.image ? (
                    <Image source={cat.image} style={styles.categoryImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.categoryImagePlaceholder, { backgroundColor: '#191919' }]}>
                      <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: isActive ? '#191919' : colors.textMuted },
                    isActive && styles.categoryLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.title.split(' ')[0]}
                </Text>
                {isActive && <View style={styles.categoryUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Pills de filtres rapides ── */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          {/* Bouton filtres avancés */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: activeFiltersCount > 0 ? '#191919' : colors.card, borderColor: activeFiltersCount > 0 ? '#191919' : colors.border },
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="options-outline" size={14} color={activeFiltersCount > 0 ? '#FFFFFF' : colors.text} />
            <Text style={[styles.filterPillText, { color: activeFiltersCount > 0 ? '#FFFFFF' : colors.text }]}>
              {language === 'fr' ? 'Filtres' : 'Filters'}
              {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Distance */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: filters.maxDistance !== 10 ? '#191919' : colors.card, borderColor: filters.maxDistance !== 10 ? '#191919' : colors.border },
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="navigate-outline" size={14} color={filters.maxDistance !== 10 ? '#FFFFFF' : colors.text} />
            <Text style={[styles.filterPillText, { color: filters.maxDistance !== 10 ? '#FFFFFF' : colors.text }]}>
              {filters.maxDistance} km
            </Text>
          </TouchableOpacity>

          {/* Prix */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: filters.maxPrice !== 200 ? '#191919' : colors.card, borderColor: filters.maxPrice !== 200 ? '#191919' : colors.border },
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="cash-outline" size={14} color={filters.maxPrice !== 200 ? '#FFFFFF' : colors.text} />
            <Text style={[styles.filterPillText, { color: filters.maxPrice !== 200 ? '#FFFFFF' : colors.text }]}>
              {language === 'fr' ? `Jusqu'à ${filters.maxPrice}€` : `Up to ${filters.maxPrice}€`}
            </Text>
          </TouchableOpacity>

          {/* Lieu */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: filters.location !== 'both' ? '#191919' : colors.card, borderColor: filters.location !== 'both' ? '#191919' : colors.border },
            ]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons
              name={filters.location === 'domicile' ? 'home-outline' : 'storefront-outline'}
              size={14}
              color={filters.location !== 'both' ? '#FFFFFF' : colors.text}
            />
            <Text style={[styles.filterPillText, { color: filters.location !== 'both' ? '#FFFFFF' : colors.text }]}>
              {filters.location === 'salon'
                ? 'En salon'
                : filters.location === 'domicile'
                ? 'À domicile'
                : language === 'fr' ? 'Lieu' : 'Location'}
            </Text>
          </TouchableOpacity>

          {/* Note */}
          {filters.minRating > 0 && (
            <TouchableOpacity
              style={[styles.filterPill, { backgroundColor: '#191919', borderColor: '#191919' }]}
              onPress={() => setShowFiltersModal(true)}
            >
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={[styles.filterPillText, { color: '#FFFFFF' }]}>
                {filters.minRating.toFixed(1)}+
              </Text>
            </TouchableOpacity>
          )}

          {/* Carte */}
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="map-outline" size={14} color={colors.text} />
            <Text style={[styles.filterPillText, { color: colors.text }]}>
              {language === 'fr' ? 'Carte' : 'Map'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Nb résultats ── */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {isLoading
            ? (language === 'fr' ? 'Recherche...' : 'Searching...')
            : `${salons.length} salon${salons.length > 1 ? 's' : ''} ${language === 'fr' ? 'trouvé' : 'found'}${salons.length > 1 ? 's' : ''}`}
        </Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFilters}>
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Liste des salons ── */}
      {isLoading && salons.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#191919" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {language === 'fr' ? 'Recherche des salons...' : 'Searching for salons...'}
          </Text>
        </View>
      ) : salons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cut-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Aucun salon trouvé' : 'No salon found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {language === 'fr'
              ? 'Essaie de modifier les filtres ou la zone de recherche'
              : 'Try adjusting the filters or search area'}
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>
              {language === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {salons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} variant="listing" />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ── Modal filtres avancés ── */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header modal */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === 'fr' ? 'Filtres' : 'Filters'}
            </Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>
                {language === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Distance */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeaderRow}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  {language === 'fr' ? 'Distance maximale' : 'Maximum distance'}
                </Text>
                <Text style={styles.filterValue}>{filters.maxDistance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={filters.maxDistance}
                onValueChange={(v) => setFilters((f) => ({ ...f, maxDistance: v }))}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>1 km</Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>50 km</Text>
              </View>
            </View>

            {/* Prix */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeaderRow}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  {language === 'fr' ? 'Budget maximum' : 'Maximum budget'}
                </Text>
                <Text style={styles.filterValue}>{filters.maxPrice}€</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={500}
                step={10}
                value={filters.maxPrice}
                onValueChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>20€</Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>500€</Text>
              </View>
            </View>

            {/* Note minimum */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeaderRow}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  {language === 'fr' ? 'Note minimum' : 'Minimum rating'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.filterValue}>
                    {filters.minRating === 0
                      ? (language === 'fr' ? 'Toutes' : 'All')
                      : filters.minRating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5}
                step={0.5}
                value={filters.minRating}
                onValueChange={(v) => setFilters((f) => ({ ...f, minRating: v }))}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>
                  {language === 'fr' ? 'Toutes' : 'All'}
                </Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>5.0 ⭐</Text>
              </View>
            </View>

            {/* Type de lieu */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text, marginBottom: 14 }]}>
                {language === 'fr' ? 'Lieu de prestation' : 'Service location'}
              </Text>
              <View style={styles.locationOptions}>
                {[
                  { id: 'both', label: language === 'fr' ? 'Les deux' : 'Both', icon: 'apps-outline' },
                  { id: 'salon', label: language === 'fr' ? 'En salon' : 'In salon', icon: 'storefront-outline' },
                  { id: 'domicile', label: language === 'fr' ? 'À domicile' : 'At home', icon: 'home-outline' },
                ].map((opt) => {
                  const isSelected = filters.location === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.locationOption,
                        {
                          backgroundColor: isSelected ? '#191919' : colors.card,
                          borderColor: isSelected ? '#191919' : colors.border,
                        },
                      ]}
                      onPress={() => setFilters((f) => ({ ...f, location: opt.id as any }))}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={20}
                        color={isSelected ? '#FFFFFF' : colors.text}
                      />
                      <Text
                        style={[
                          styles.locationOptionText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer modal */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Text style={styles.applyButtonText}>
                {language === 'fr'
                  ? `Voir ${salons.length} résultat${salons.length > 1 ? 's' : ''}`
                  : `See ${salons.length} result${salons.length > 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
      <AuthGuardModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Connectez-vous pour voir les détails du salon et réserver"
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  logoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  logoImage: { width: '100%', height: '100%' },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  locationPillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  loginButton: {
    backgroundColor: '#191919',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  switchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  /* Category image filter bar */
  categorySection: {
    borderBottomWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingBottom: 0,
    gap: 2,
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 4,
    position: 'relative',
    minWidth: 72,
  },
  categoryImageWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  categoryImageWrapperActive: {
    borderColor: '#191919',
  },
  categoryImage: { width: '100%', height: '100%' },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 68,
  },
  categoryLabelActive: {
    fontWeight: '700',
    color: '#191919',
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#191919',
    borderRadius: 1,
  },

  /* Filter pills */
  filterRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterPills: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Results row */
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearFilters: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191919',
    textDecorationLine: 'underline',
  },

  /* List */
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 20,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: { fontSize: 14 },

  /* Empty */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  resetBtn: {
    marginTop: 8,
    backgroundColor: '#191919',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  /* Modal */
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  resetText: { fontSize: 14, color: '#7C3AED', fontWeight: '500' },
  modalContent: { flex: 1, padding: 20 },
  filterSection: { marginBottom: 28 },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: { fontSize: 16, fontWeight: '600' },
  filterValue: { fontSize: 16, fontWeight: '700', color: '#191919' },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  sliderLabel: { fontSize: 11 },
  locationOptions: { flexDirection: 'row', gap: 10 },
  locationOption: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  locationOptionText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    backgroundColor: '#191919',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
