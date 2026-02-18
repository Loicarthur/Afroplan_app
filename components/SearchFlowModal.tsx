/**
 * Search Flow Modal - AfroPlan
 * Flow UX en étapes pour rechercher un salon/coiffeur
 * "Rechercher mon salon/coiffeur"
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

// Types de coiffure
const HAIRSTYLE_TYPES = [
  { id: 'tresses', name: 'Tresses', icon: '👩🏾‍🦱', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200' },
  { id: 'locks', name: 'Locks', icon: '🧔🏾', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200' },
  { id: 'coupe', name: 'Coupe', icon: '✂️', image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200' },
  { id: 'soins', name: 'Soins', icon: '💆🏾', image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=200' },
  { id: 'coloration', name: 'Coloration', icon: '🎨', image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200' },
  { id: 'tissage', name: 'Tissage', icon: '👸🏾', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200' },
  { id: 'cornrows', name: 'Cornrows', icon: '🪮', image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200' },
  { id: 'afro', name: 'Afro', icon: '🌟', image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=200' },
];

// Types de cheveux
const HAIR_TYPES = [
  { id: '3a', name: 'Type 3A', description: 'Boucles larges' },
  { id: '3b', name: 'Type 3B', description: 'Boucles serrées' },
  { id: '3c', name: 'Type 3C', description: 'Boucles très serrées' },
  { id: '4a', name: 'Type 4A', description: 'Frisés serrés' },
  { id: '4b', name: 'Type 4B', description: 'Frisés zigzag' },
  { id: '4c', name: 'Type 4C', description: 'Très crépus' },
];

// Lieux
const LOCATION_OPTIONS = [
  { id: 'salon', name: 'En salon', icon: 'storefront', description: 'Se déplacer au salon professionnel' },
  { id: 'coiffeur', name: 'Chez le coiffeur', icon: 'person', description: 'À son domicile ou son atelier' },
  { id: 'domicile', name: 'À domicile', icon: 'home', description: 'Le coiffeur vient chez vous' },
];

interface SearchFlowModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  hairstyle: string | null;
  hairType: string[];
  location: string | null;
  maxBudget: number;
  maxDistance: number;
  showAll: boolean;
}

// Distance presets for quick selection
const DISTANCE_PRESETS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 60, label: '60 km' },
];

export default function SearchFlowModal({ visible, onClose, onSearch }: SearchFlowModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Localisation desactivee (temporairement)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userLocation = null;
  const getCurrentLocation = () => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const locationLoading = false;

  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    hairstyle: null,
    hairType: [],
    location: null,
    maxBudget: 150,
    maxDistance: 20,
    showAll: false,
  });

  const totalSteps = 3;

  const resetAndClose = () => {
    setStep(1);
    setFilters({
      hairstyle: null,
      hairType: [],
      location: null,
      maxBudget: 150,
      maxDistance: 10,
      showAll: false,
    });
    onClose();
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onSearch(filters);
      resetAndClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      resetAndClose();
    }
  };

  const selectHairstyle = (id: string) => {
    setFilters({ ...filters, hairstyle: id });
  };

  const toggleHairType = (id: string) => {
    const current = filters.hairType;
    if (current.includes(id)) {
      setFilters({ ...filters, hairType: current.filter(t => t !== id) });
    } else {
      setFilters({ ...filters, hairType: [...current, id] });
    }
  };

  const selectLocation = (id: string) => {
    setFilters({ ...filters, location: id });
  };

  const canProceed = () => {
    if (step === 1) return filters.hairstyle !== null;
    return true;
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Choisis ta coiffure</Text>
            <Text style={styles.stepSubtitle}>Quel style te ferait plaisir ?</Text>

            <View style={styles.hairstyleGrid}>
              {HAIRSTYLE_TYPES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.hairstyleCard,
                    filters.hairstyle === style.id && styles.hairstyleCardSelected
                  ]}
                  onPress={() => selectHairstyle(style.id)}
                >
                  <Image
                    source={{ uri: style.image }}
                    style={styles.hairstyleImage}
                    contentFit="cover"
                  />
                  <View style={styles.hairstyleOverlay}>
                    <Text style={styles.hairstyleEmoji}>{style.icon}</Text>
                    <Text style={styles.hairstyleName}>{style.name}</Text>
                  </View>
                  {filters.hairstyle === style.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Filtre rapide</Text>
            <Text style={styles.stepSubtitle}>Optionnel - Affine ta recherche</Text>

            {/* Type de cheveux */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Type de cheveux</Text>
              <View style={styles.hairTypeGrid}>
                {HAIR_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.hairTypeChip,
                      filters.hairType.includes(type.id) && styles.hairTypeChipSelected
                    ]}
                    onPress={() => toggleHairType(type.id)}
                  >
                    <Text style={[
                      styles.hairTypeChipText,
                      filters.hairType.includes(type.id) && styles.hairTypeChipTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lieu */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Où souhaites-tu te faire coiffer ?</Text>
              <View style={styles.locationOptions}>
                {LOCATION_OPTIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.locationCard,
                      filters.location === loc.id && styles.locationCardSelected
                    ]}
                    onPress={() => selectLocation(loc.id)}
                  >
                    <View style={[
                      styles.locationIconWrap,
                      filters.location === loc.id && styles.locationIconWrapSelected,
                    ]}>
                      <Ionicons
                        name={loc.icon as any}
                        size={22}
                        color={filters.location === loc.id ? '#FFFFFF' : '#191919'}
                      />
                    </View>
                    <View style={styles.locationCardText}>
                      <Text style={[
                        styles.locationName,
                        filters.location === loc.id && styles.locationNameSelected
                      ]}>
                        {loc.name}
                      </Text>
                      <Text style={[
                        styles.locationDesc,
                        filters.location === loc.id && styles.locationDescSelected
                      ]}>
                        {loc.description}
                      </Text>
                    </View>
                    {filters.location === loc.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#191919" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>{t('search.budgetDistance')}</Text>
            <Text style={styles.stepSubtitle}>{t('search.optional')}</Text>

            {/* Geolocation button (désactivé) */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.geoButton}
                onPress={getCurrentLocation}
                disabled={true}
              >
                <Ionicons
                  name="location-outline"
                  size={22}
                  color="#808080"
                />
                <Text style={styles.geoButtonTextDisabled}>
                  Localisation désactivée (temporairement)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Budget slider */}
            <View style={styles.filterSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.filterLabel}>{t('search.maxBudget')}</Text>
                <Text style={styles.sliderValue}>{filters.maxBudget} €</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={300}
                step={10}
                value={filters.maxBudget}
                onValueChange={(value) => setFilters({ ...filters, maxBudget: value })}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>20 €</Text>
                <Text style={styles.sliderLabel}>300 €</Text>
              </View>
            </View>

            {/* Distance presets */}
            <View style={styles.filterSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.filterLabel}>{t('search.maxDistance')}</Text>
                <Text style={styles.sliderValue}>{filters.maxDistance} km</Text>
              </View>

              <View style={styles.distancePresets}>
                {DISTANCE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.distancePresetChip,
                      filters.maxDistance === preset.value && styles.distancePresetChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, maxDistance: preset.value })}
                  >
                    <Text style={[
                      styles.distancePresetText,
                      filters.maxDistance === preset.value && styles.distancePresetTextActive,
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={filters.maxDistance}
                onValueChange={(value) => setFilters({ ...filters, maxDistance: value })}
                minimumTrackTintColor="#191919"
                maximumTrackTintColor="#E5E5E5"
                thumbTintColor="#191919"
              />

              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1 km</Text>
                <Text style={styles.sliderLabel}>100 km</Text>
              </View>
            </View>

            {/* Show all option */}
            <TouchableOpacity
              style={[
                styles.showAllOption,
                filters.showAll && styles.showAllOptionSelected
              ]}
              onPress={() => setFilters({ ...filters, showAll: !filters.showAll })}
            >
              <View style={[
                styles.checkbox,
                filters.showAll && styles.checkboxSelected
              ]}>
                {filters.showAll && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.showAllText}>
                {t('search.showAllSalons')}
              </Text>
            </TouchableOpacity>

            {/* Payment info */}
            <View style={styles.paymentInfo}>
              <Ionicons name="information-circle" size={20} color="#7C3AED" />
              <Text style={styles.paymentInfoText}>
                {t('search.paymentInfo')}
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={resetAndClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name={step === 1 ? 'close' : 'arrow-back'} size={24} color="#191919" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepIndicator}>Étape {step}/{totalSteps}</Text>
        </View>

        {/* Welcome text (only on step 1) */}
        {step === 1 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Trouve facilement ton coiffeur afro</Text>
            <Text style={styles.welcomeSubtitle}>
              Quelques questions rapides pour te proposer les meilleurs salons adaptés à tes besoins.
            </Text>
          </Animated.View>
        )}

        {/* Step content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.footerHint}>
            Tu peux revenir en arrière à tout moment
          </Text>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {step === totalSteps ? 'Voir les résultats' : 'Suivant'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  progressDotActive: {
    backgroundColor: '#191919',
    width: 24,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#808080',
    fontWeight: '500',
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 24,
  },
  hairstyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hairstyleCard: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hairstyleCardSelected: {
    borderColor: '#191919',
  },
  hairstyleImage: {
    ...StyleSheet.absoluteFillObject,
  },
  hairstyleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairstyleEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  hairstyleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    marginBottom: 28,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 12,
  },
  hairTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hairTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  hairTypeChipSelected: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  hairTypeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191919',
  },
  hairTypeChipTextSelected: {
    color: '#FFFFFF',
  },
  locationOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationCardSelected: {
    backgroundColor: '#F0F0F0',
    borderColor: '#191919',
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconWrapSelected: {
    backgroundColor: '#191919',
  },
  locationCardText: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191919',
  },
  locationNameSelected: {
    color: '#191919',
  },
  locationDesc: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  locationDescSelected: {
    color: '#4A4A4A',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191919',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#808080',
  },
  showAllOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 20,
  },
  showAllOptionSelected: {
    backgroundColor: '#F0F0F0',
    borderColor: '#191919',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  showAllText: {
    flex: 1,
    fontSize: 14,
    color: '#191919',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#7C3AED10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  paymentInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 18,
  },
  geoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  geoButtonTextDisabled: {
    fontSize: 14,
    fontWeight: '600',
    color: '#808080',
  },
  distancePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  distancePresetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  distancePresetChipActive: {
    backgroundColor: '#191919',
    borderColor: '#191919',
  },
  distancePresetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191919',
  },
  distancePresetTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#f9f8f8',
  },
  footerHint: {
    fontSize: 12,
    color: '#808080',
    textAlign: 'center',
    marginBottom: 12,
  },
  nextButton: {
    backgroundColor: '#191919',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
