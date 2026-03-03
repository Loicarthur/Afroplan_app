/**
 * Search Flow Modal - AfroPlan (Design Airbnb-Inspired - AfroPlan Edition)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
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
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useLanguage } from '@/contexts/LanguageContext';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

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
  
  const [activeStep, setActiveStep] = useState<'where' | 'style' | 'filters'>('where');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string | null>(null);
  const [selectedHairTypes, setSelectedHairTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState(150);
  const [distance, setDistance] = useState(20);

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
    setActiveStep('style');
  };

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
        setActiveStep('style');
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
    setActiveStep('where');
  };

  const renderStepHeader = (step: 'where' | 'style' | 'filters', title: string, value: string) => {
    const isActive = activeStep === step;
    return (
      <TouchableOpacity 
        style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setActiveStep(step)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <View style={styles.activeStepHeader}>
            <Text style={[styles.stepTitleActive, { color: colors.text }]}>{title}</Text>
          </View>
        ) : (
          <View style={styles.inactiveStepHeader}>
            <Text style={[styles.stepTitleInactive, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={[styles.stepValue, { color: colors.text }]} numberOfLines={1}>{value || 'Ajouter'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="overFullScreen" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.sheetContainer, { backgroundColor: '#F7F7F7', paddingTop: insets.top }]}>
          
          {/* Top Navigation - Version ultra-épurée */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={20} color="#191919" />
            </TouchableOpacity>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* STEP 1: WHERE */}
            <View style={styles.stepWrapper}>
              {activeStep === 'where' ? (
                <Animated.View entering={FadeIn} style={[styles.expandedCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.expandedTitle}>Où voulez-vous vous coiffer ?</Text>
                  <View style={styles.searchBoxAirbnb}>
                    <Ionicons name="search" size={20} color="#191919" />
                    <TextInput
                      style={styles.inputAirbnb}
                      placeholder="Ville, quartier ou adresse..."
                      placeholderTextColor="#808080"
                      value={locationText}
                      onChangeText={handleLocationChange}
                      autoFocus
                    />
                    <TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading} style={styles.locateBtnAirbnb}>
                      {locationLoading ? (
                        <ActivityIndicator size="small" color="#191919" />
                      ) : (
                        <Ionicons name="locate" size={22} color="#191919" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {showPredictions && predictions.length > 0 ? (
                    <View style={styles.predictionsList}>
                      {predictions.map((p, i) => (
                        <TouchableOpacity key={i} style={styles.predictionRow} onPress={() => selectPrediction(p)}>
                          <View style={styles.locationIconCircle}>
                            <Ionicons name="location-sharp" size={18} color="#191919" />
                          </View>
                          <Text style={styles.predictionText}>{p.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.suggestionsAirbnb}>
                      <TouchableOpacity style={styles.suggestionItemAirbnb} onPress={getCurrentLocation}>
                        <View style={[styles.iconCircle, { backgroundColor: '#F0F0F0' }]}>
                          <Ionicons name="navigate" size={20} color="#191919" />
                        </View>
                        <Text style={styles.suggestionTextAirbnb}>À proximité</Text>
                      </TouchableOpacity>
                      <Text style={styles.recentTitle}>Suggestions de destinations</Text>
                      <TouchableOpacity style={styles.suggestionItemAirbnb} onPress={() => selectPrediction({description: 'Paris, France'})}>
                        <View style={[styles.iconCircle, { backgroundColor: '#F7F7F7' }]}>
                          <Ionicons name="time-outline" size={20} color="#808080" />
                        </View>
                        <Text style={styles.suggestionTextAirbnb}>Paris, France</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suggestionItemAirbnb} onPress={() => selectPrediction({description: 'Lyon, France'})}>
                        <View style={[styles.iconCircle, { backgroundColor: '#F7F7F7' }]}>
                          <Ionicons name="time-outline" size={20} color="#808080" />
                        </View>
                        <Text style={styles.suggestionTextAirbnb}>Lyon, France</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              ) : (
                renderStepHeader('where', 'Où', locationText || 'À proximité')
              )}
            </View>

            {/* STEP 2: STYLE */}
            <View style={styles.stepWrapper}>
              {activeStep === 'style' ? (
                <Animated.View entering={FadeIn} style={[styles.expandedCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.expandedTitle}>Quel style ?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleGridAirbnb}>
                    {HAIRSTYLE_CATEGORIES.map((cat) => (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.styleCardAirbnb, selectedCategory === cat.id && styles.styleCardActive]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <Image source={cat.styles[0]?.image} style={styles.styleImgAirbnb} contentFit="cover" />
                        <Text style={styles.styleNameAirbnb}>{cat.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {selectedCategory && (
                    <View style={styles.subStylesAirbnb}>
                      <Text style={styles.subTitleAirbnb}>Précisez :</Text>
                      <View style={styles.chipCloud}>
                        {HAIRSTYLE_CATEGORIES.find(c => c.id === selectedCategory)?.styles.map(s => (
                          <TouchableOpacity 
                            key={s.id} 
                            style={[styles.airbnbChip, selectedSubStyle === s.name && styles.airbnbChipActive]}
                            onPress={() => setSelectedSubStyle(s.name)}
                          >
                            <Text style={[styles.airbnbChipText, selectedSubStyle === s.name && styles.airbnbChipTextActive]}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </Animated.View>
              ) : (
                renderStepHeader('style', 'Style', selectedSubStyle || selectedCategory || 'Tous les styles')
              )}
            </View>

            {/* STEP 3: FILTERS */}
            <View style={styles.stepWrapper}>
              {activeStep === 'filters' ? (
                <Animated.View entering={FadeIn} style={[styles.expandedCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.expandedTitle}>Filtres</Text>
                  
                  <Text style={styles.filterLabelAirbnb}>Budget max : {budget}€</Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={20}
                    maximumValue={500}
                    step={10}
                    value={budget}
                    onValueChange={setBudget}
                    minimumTrackTintColor="#191919"
                    maximumTrackTintColor="#E5E5E5"
                    thumbTintColor="#191919"
                  />

                  <Text style={[styles.filterLabelAirbnb, { marginTop: 20 }]}>Type de cheveux</Text>
                  <View style={styles.chipCloud}>
                    {HAIR_TYPES.map(type => (
                      <TouchableOpacity 
                        key={type} 
                        style={[styles.airbnbChip, selectedHairTypes.includes(type) && styles.airbnbChipActive]}
                        onPress={() => setSelectedHairTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                      >
                        <Text style={[styles.airbnbChipText, selectedHairTypes.includes(type) && styles.airbnbChipTextActive]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              ) : (
                renderStepHeader('filters', 'Filtres', `${budget}€ • ${selectedHairTypes.length > 0 ? selectedHairTypes.join(',') : 'Tous types'}`)
              )}
            </View>

          </ScrollView>

          {/* Footer Fixe - AfroPlan Edition (Noir & Blanc) */}
          <View style={[styles.footerAirbnb, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearTextAirbnb}>Tout effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtnAirbnb} onPress={handleApply}>
              <Ionicons name="search" size={18} color="#FFF" />
              <Text style={styles.searchBtnTextAirbnb}>Rechercher</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetContainer: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  closeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  navTabs: { flexDirection: 'row', gap: 20 },
  navTab: { fontSize: 16, fontWeight: '700' },
  navTabActive: { color: '#191919', textDecorationLine: 'underline' },
  scrollContent: { padding: 12, gap: 12 },
  
  // Step Cards
  stepWrapper: { width: '100%' },
  stepCard: { padding: 16, borderRadius: 16, borderWeight: 1, ...Shadows.sm },
  inactiveStepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeStepHeader: { marginBottom: 8 },
  stepTitleInactive: { fontSize: 14, fontWeight: '600' },
  stepTitleActive: { fontSize: 22, fontWeight: '800' },
  stepValue: { fontSize: 14, fontWeight: '700' },
  
  expandedCard: { padding: 20, borderRadius: 24, ...Shadows.md },
  expandedTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#191919' },
  
  // Search Box
  searchBoxAirbnb: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#191919', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, gap: 10 },
  inputAirbnb: { flex: 1, fontSize: 16, fontWeight: '600', color: '#191919' },
  locateBtnAirbnb: { padding: 4, marginLeft: 4 },
  
  suggestionsAirbnb: { marginTop: 20, gap: 16 },
  suggestionItemAirbnb: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  suggestionTextAirbnb: { fontSize: 16, fontWeight: '600', color: '#191919' },
  recentTitle: { fontSize: 13, fontWeight: '800', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', opacity: 0.5 },
  
  predictionsList: { marginTop: 12 },
  predictionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  locationIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  predictionText: { fontSize: 14, fontWeight: '500', color: '#191919' },

  // Style Grid
  styleGridAirbnb: { marginHorizontal: -20, paddingHorizontal: 20 },
  styleCardAirbnb: { width: 130, height: 130, marginRight: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  styleCardActive: { borderColor: '#191919' },
  styleImgAirbnb: { width: '100%', height: 95 },
  styleNameAirbnb: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 8, color: '#191919' },
  
  subStylesAirbnb: { marginTop: 24 },
  subTitleAirbnb: { fontSize: 14, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' },
  chipCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  airbnbChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5, borderColor: '#E5E5E5', backgroundColor: '#FFF' },
  airbnbChipActive: { backgroundColor: '#191919', borderColor: '#191919' },
  airbnbChipText: { fontSize: 13, fontWeight: '700', color: '#191919' },
  airbnbChipTextActive: { color: '#FFF' },
  
  filterLabelAirbnb: { fontSize: 16, fontWeight: '800', marginBottom: 10, color: '#191919' },
  
  footerAirbnb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  clearTextAirbnb: { fontSize: 16, fontWeight: '700', textDecorationLine: 'underline', color: '#191919' },
  searchBtnAirbnb: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#191919', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14, ...Shadows.md },
  searchBtnTextAirbnb: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
