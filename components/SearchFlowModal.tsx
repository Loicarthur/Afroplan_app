/**
 * Search Flow Modal - AfroPlan (Design Premium & Responsive)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn, SlideInDown } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useLanguage } from '@/contexts/LanguageContext';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const horizontalPadding = 24;
const gridGap = 12;
const cardWidth = (width - (horizontalPadding * 2) - gridGap) / 2;

const HAIR_TYPES = ['3A', '3B', '3C', '4A', '4B', '4C'];

interface SearchFlowModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: any) => void;
}

export default function SearchFlowModal({ visible, onClose, onSearch }: SearchFlowModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [locationText, setLocationText] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [predictions, setSuggestions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowPredictions(false);
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=(cities)&language=fr`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.predictions) {
        setSuggestions(json.predictions);
        setShowPredictions(true);
      }
    } catch (e) {
      console.error('Autocomplete error:', e);
    }
  };

  const handleLocationChange = (text: string) => {
    setLocationText(text);
    fetchPredictions(text);
  };

  const selectPrediction = (prediction: any) => {
    setLocationText(prediction.description);
    setSuggestions([]);
    setShowPredictions(false);
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string | null>(null);
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState(150);
  const [distance, setDistance] = useState(20);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (reverseGeocode[0]) {
        const city = reverseGeocode[0].city || reverseGeocode[0].region;
        setLocationText(city || 'Ma position');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleApply = () => {
    onSearch({
      hairstyle: selectedCategory,
      subStyle: selectedSubStyle,
      hairType: selectedHairTypes,
      location: 'both',
      maxBudget: budget,
      maxDistance: distance,
      city: locationText
    });
    onClose();
  };

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedSubStyle(null);
    setSelectedHairTypes([]);
    setLocationText('');
    setBudget(150);
    setDistance(20);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Élégant avec Safe Area ++ */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 20, 40) }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recherche</Text>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.resetText}>Effacer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View style={styles.content}>
            
            {/* 1. Localisation */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DESTINATION</Text>
              <View style={[styles.locationInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Où voulez-vous vous coiffer ?"
                  placeholderTextColor={colors.placeholder}
                  value={locationText}
                  onChangeText={handleLocationChange}
                />
                <TouchableOpacity onPress={getCurrentLocation} style={styles.locationBtn}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="locate" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Liste des suggestions Autocomplete */}
              {showPredictions && predictions.length > 0 && (
                <Animated.View entering={FadeIn.duration(200)} style={[styles.predictionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {predictions.map((item, index) => (
                    <TouchableOpacity
                      key={item.place_id || index}
                      style={[styles.predictionItem, index < predictions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                      onPress={() => selectPrediction(item)}
                    >
                      <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.predictionText, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* 2. Grille de Catégories Responsive */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATÉGORIES</Text>
              <View style={styles.categoryGrid}>
                {HAIRSTYLE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    style={[
                      styles.categoryCard,
                      { width: cardWidth, borderColor: selectedCategory === cat.id ? colors.primary : 'transparent' }
                    ]}
                    onPress={() => {
                      setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                      setSelectedSubStyle(null);
                    }}
                  >
                    <Image source={cat.styles[0]?.image} style={styles.categoryImage} contentFit="cover" />
                    <View style={styles.categoryOverlay}>
                      <Text style={styles.categoryName}>{cat.title}</Text>
                    </View>
                    {selectedCategory === cat.id && (
                      <Animated.View entering={FadeIn.duration(200)} style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sous-styles fluides */}
              {selectedCategory && (
                <Animated.View entering={FadeInUp.duration(300)} style={styles.subStyleWrapper}>
                  <Text style={styles.subTitle}>Style précis :</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subStyleScroll}>
                    {HAIRSTYLE_CATEGORIES.find(c => c.id === selectedCategory)?.styles.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.subStyleChip,
                          selectedSubStyle === s.name ? { backgroundColor: '#191919' } : { backgroundColor: colors.card, borderColor: colors.border }
                        ]}
                        onPress={() => setSelectedSubStyle(selectedSubStyle === s.name ? null : s.name)}
                      >
                        <Text style={[styles.subStyleText, { color: selectedSubStyle === s.name ? '#FFF' : colors.text }]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}
            </View>

            {/* 3. Type de Cheveux Grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TYPE DE CHEVEUX</Text>
              <View style={styles.hairGrid}>
                {HAIR_TYPES.map((type) => {
                  const isSelected = selectedHairTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.hairChip,
                        { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary + '10' : colors.card }
                      ]}
                      onPress={() => setSelectedHairTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                    >
                      <Text style={[styles.hairText, { color: isSelected ? colors.primary : colors.text }]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Filtres de Précision */}
            <View style={styles.section}>
              <View style={styles.filterHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BUDGET MAX</Text>
                <Text style={[styles.filterVal, { color: colors.primary }]}>{budget} €</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={500}
                step={10}
                value={budget}
                onValueChange={setBudget}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.filterHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DISTANCE MAX</Text>
                <Text style={[styles.filterVal, { color: colors.primary }]}>{distance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>

          </View>
        </ScrollView>

        {/* Footer Fixe */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.applyButton, { backgroundColor: '#191919' }]} 
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Afficher les coiffeurs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  iconBtn: { padding: 4 },
  resetText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  content: { padding: horizontalPadding },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 16 },
  
  // Localisation
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
    ...Shadows.sm,
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000000', 
    includeFontPadding: false,
    paddingVertical: Platform.OS === 'android' ? 0 : 4,
  },
  locationBtn: { padding: 4 },

  // Autocomplete Suggestions
  predictionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 100,
    ...Shadows.md,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  predictionText: {
    fontSize: 14,
    flex: 1,
  },

  // Grille de catégories
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap },
  categoryCard: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    ...Shadows.md,
  },
  categoryImage: { ...StyleSheet.absoluteFillObject },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  categoryName: { color: '#FFF', fontWeight: '800', fontSize: 13, textAlign: 'center', textTransform: 'uppercase' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },

  // Sous-styles
  subStyleWrapper: { marginTop: 20 },
  subTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, opacity: 0.7 },
  subStyleScroll: { marginHorizontal: -horizontalPadding, paddingHorizontal: horizontalPadding },
  subStyleChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1, marginRight: 8 },
  subStyleText: { fontSize: 13, fontWeight: '600' },

  // Hair Grid
  hairGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hairChip: {
    width: (width - (horizontalPadding * 2) - 20) / 3,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
  },
  hairText: { fontWeight: '800', fontSize: 14 },

  // Sliders
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterVal: { fontSize: 16, fontWeight: '800' },
  slider: { width: '105%', height: 40, marginLeft: -10 },

  // Footer
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.05)', 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  applyButton: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
