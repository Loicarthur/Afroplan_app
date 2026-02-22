/**
 * Page de gestion des styles - Espace Coiffeur AfroPlan
 * Catalogue de styles afro prédéfinis avec configuration prix/durée/lieu
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { salonService } from '@/services/salon.service';

// ─── CATALOGUE DES STYLES AFRO PRÉDÉFINIS ───────────────────────────────────

type StyleEntry = {
  id: string;
  name: string;
  image?: any;
};

type StyleCategory = {
  id: string;
  label: string;
  emoji: string;
  styles: StyleEntry[];
};

// On mappe les catégories et styles globaux vers le catalogue du coiffeur
const STYLE_CATALOG: StyleCategory[] = HAIRSTYLE_CATEGORIES.map(cat => ({
  id: cat.id,
  label: cat.title,
  emoji: cat.emoji,
  styles: cat.styles.map(s => ({
    id: s.id,
    name: s.name,
    image: s.image
  }))
}));

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ServiceLocation = 'salon' | 'domicile' | 'both';

type ConfiguredStyle = {
  styleId: string;
  styleName: string;
  categoryLabel: string;
  price: string;
  duration: string;
  location: ServiceLocation;
  requiresExtensions: boolean;
  extensionsIncluded: boolean;
  image?: any;
  customDescription?: string;
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function CoiffeurServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();

  // Styles sélectionnés et configurés
  const [configuredStyles, setConfiguredStyles] = useState<ConfiguredStyle[]>([]);
  
  // Nouveaux états pour la sélection par lot
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [isBatchConfiguring, setIsBatchConfiguring] = useState(false);
  const [batchData, setBatchData] = useState<Record<string, Partial<ConfiguredStyle>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Vue catalogue ou vue "mes styles"
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_styles'>('catalog');

  const isStyleConfigured = (styleId: string) =>
    configuredStyles.some((s) => s.styleId === styleId);

  const toggleStyleSelection = (styleId: string) => {
    setSelectedStyleIds(prev => 
      prev.includes(styleId) 
        ? prev.filter(id => id !== styleId) 
        : [...prev, styleId]
    );
  };

  const startBatchConfiguration = () => {
    if (selectedStyleIds.length === 0) return;
    
    // Initialiser les données pour les nouveaux styles
    const initialData: Record<string, Partial<ConfiguredStyle>> = {};
    selectedStyleIds.forEach(id => {
      const existing = configuredStyles.find(s => s.styleId === id);
      if (existing) {
        initialData[id] = { ...existing };
      } else {
        const styleEntry = STYLE_CATALOG.flatMap(c => c.styles).find(s => s.id === id);
        initialData[id] = {
          styleId: id,
          styleName: styleEntry?.name,
          location: 'salon',
          price: '',
          duration: '',
          requiresExtensions: false,
          extensionsIncluded: false,
          customDescription: ''
        };
      }
    });
    
    setBatchData(initialData);
    setIsBatchConfiguring(true);
  };

  const updateBatchItem = (styleId: string, updates: Partial<ConfiguredStyle>) => {
    setBatchData(prev => ({
      ...prev,
      [styleId]: { ...prev[styleId], ...updates }
    }));
  };

  const handleSaveBatch = async () => {
    if (!user) return;

    // Validation simple
    const stylesToSave = Object.values(batchData) as ConfiguredStyle[];
    const invalid = stylesToSave.find(s => !s.price || !s.duration);
    
    if (invalid) {
      Alert.alert('Champs requis', 'Veuillez renseigner le prix et la durée pour tous les styles sélectionnés.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Récupérer le salon du coiffeur
      let salon = await salonService.getSalonByOwnerId(user.id);
      
      // Si pas de salon, on devrait normalement en créer un ou rediriger, 
      // mais pour l'instant on suppose que l'onboarding l'a fait.
      if (!salon) {
        Alert.alert('Erreur', 'Aucun salon associé à ce compte.');
        setIsSaving(false);
        return;
      }

      // 2. Préparer les données pour Supabase
      const servicesPayload = stylesToSave.map(style => ({
        salon_id: salon!.id,
        name: style.styleName,
        category: style.categoryLabel,
        price: parseFloat(style.price),
        duration_minutes: parseInt(style.duration, 10),
        description: style.customDescription || null, // On stocke la note dans description
        service_location: style.location,
        is_active: true,
        // On pourrait stocker l'ID du style original dans une colonne metadata si besoin
      }));

      // 3. Sauvegarder
      await salonService.upsertServicesBatch(servicesPayload);

      // 4. Mettre à jour l'état local
      setConfiguredStyles(prev => {
        const filtered = prev.filter(s => !selectedStyleIds.includes(s.styleId));
        return [...filtered, ...stylesToSave];
      });

      setIsBatchConfiguring(false);
      setSelectedStyleIds([]);
      setActiveTab('my_styles');
      Alert.alert('Succès', `${selectedStyleIds.length} style(s) configuré(s) et sauvegardé(s).`);

    } catch (error) {
      if (__DEV__) console.error(error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les services. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveStyle = (styleId: string) => {
    Alert.alert(
      'Retirer ce style',
      'Voulez-vous retirer ce style de vos prestations ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () =>
            setConfiguredStyles((prev) => prev.filter((s) => s.styleId !== styleId)),
        },
      ]
    );
  };

  const formatDuration = (minutes: string) => {
    const m = parseInt(minutes, 10);
    if (isNaN(m)) return `${minutes}min`;
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h${rem}` : `${h}h`;
  };

  const locationLabel = (loc: ServiceLocation) => {
    if (loc === 'salon') return 'En salon';
    if (loc === 'domicile') return 'À domicile';
    return 'Salon & Domicile';
  };

  const locationIcon = (loc: ServiceLocation): 'storefront-outline' | 'home-outline' | 'swap-horizontal-outline' => {
    if (loc === 'salon') return 'storefront-outline';
    if (loc === 'domicile') return 'home-outline';
    return 'swap-horizontal-outline';
  };

  // ─── AUTH GUARD ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="cut" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mes styles</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour sélectionner vos styles et gérer vos prestations
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}>
            <Text style={[styles.authLink, { color: colors.primary }]}>Créer un compte Pro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── RENDU PRINCIPAL ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'catalog' && styles.tabActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'catalog' ? colors.primary : colors.textSecondary }]}>
            Catalogue
          </Text>
          {activeTab === 'catalog' && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_styles' && styles.tabActive]}
          onPress={() => setActiveTab('my_styles')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'my_styles' ? colors.primary : colors.textSecondary }]}>
            Mes prestations ({configuredStyles.length})
          </Text>
          {activeTab === 'my_styles' && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ─── ONGLET CATALOGUE ─────────────────────────────────────────────── */}
          {activeTab === 'catalog' && (
            <View style={styles.catalogContainer}>
              <Text style={[styles.catalogHint, { color: colors.textSecondary }]}>
                Cochez tous les styles que vous proposez, puis cliquez sur le bouton de configuration en bas.
              </Text>

              {STYLE_CATALOG.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryLabel, { color: colors.text }]}>{category.label}</Text>
                  </View>

                  <View style={styles.stylesGrid}>
                    {category.styles.map((style) => {
                      const isSelected = selectedStyleIds.includes(style.id);
                      const isSaved = isStyleConfigured(style.id);
                      
                      return (
                        <TouchableOpacity
                          key={style.id}
                          style={[
                            styles.styleChip,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                            isSaved && !isSelected && { borderColor: colors.success + '50' }
                          ]}
                          onPress={() => toggleStyleSelection(style.id)}
                          activeOpacity={0.7}
                        >
                          {style.image && (
                            <Image
                              source={style.image}
                              style={styles.styleChipImage}
                              contentFit="cover"
                            />
                          )}
                          <View style={styles.styleChipContent}>
                            <View style={styles.styleChipTop}>
                              <View style={[
                                styles.styleCheck, 
                                { backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary, borderColor: isSelected ? colors.primary : colors.border },
                                !isSelected && { borderWidth: 1 }
                              ]}>
                                {isSelected && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                              </View>
                              <Text
                                style={[
                                  styles.styleChipName,
                                  { color: isSelected ? colors.primary : colors.text },
                                ]}
                                numberOfLines={1}
                              >
                                {style.name}
                              </Text>
                            </View>
                            {isSaved && !isSelected && (
                              <View style={styles.styleChipSavedBadge}>
                                <Text style={styles.styleChipSavedText}>Déjà configuré</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={{ height: 120 }} />
            </View>
          )}

          {/* ─── ONGLET MES PRESTATIONS ───────────────────────────────────────── */}
          {activeTab === 'my_styles' && (
            <View style={styles.myStylesContainer}>
              {configuredStyles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="cut-outline" size={64} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune prestation</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Allez dans le catalogue et cochez les styles que vous maîtrisez
                  </Text>
                  <Button
                    title="Voir le catalogue"
                    onPress={() => setActiveTab('catalog')}
                    style={{ marginTop: Spacing.lg }}
                  />
                </View>
              ) : (
                configuredStyles.map((cs) => (
                  <View
                    key={cs.styleId}
                    style={[styles.myStyleCard, { backgroundColor: colors.card }, Shadows.sm]}
                  >
                    <View style={styles.myStyleCardHeader}>
                      {cs.image && (
                        <Image
                          source={cs.image}
                          style={styles.myStyleImage}
                          contentFit="cover"
                        />
                      )}
                      <View style={styles.myStyleInfo}>
                        <Text style={[styles.myStyleName, { color: colors.text }]}>{cs.styleName}</Text>
                        <Text style={[styles.myStyleCategory, { color: colors.textMuted }]}>{cs.categoryLabel}</Text>
                        {cs.customDescription ? (
                          <Text style={[styles.myStyleDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {cs.customDescription}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.myStyleActions}>
                        <TouchableOpacity
                          style={[styles.myStyleEditBtn, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            setSelectedStyleIds([cs.styleId]);
                            startBatchConfiguration();
                          }}
                        >
                          <Ionicons name="pencil" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.myStyleDeleteBtn, { borderColor: colors.error }]}
                          onPress={() => handleRemoveStyle(cs.styleId)}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.myStyleDetails}>
                      <View style={[styles.myStyleBadge, { backgroundColor: '#22C55E20' }]}>
                        <Ionicons name="cash-outline" size={14} color="#22C55E" />
                        <Text style={[styles.myStyleBadgeText, { color: '#22C55E' }]}>{cs.price} €</Text>
                      </View>
                      <View style={[styles.myStyleBadge, { backgroundColor: '#3B82F620' }]}>
                        <Ionicons name="time-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.myStyleBadgeText, { color: '#3B82F6' }]}>{formatDuration(cs.duration)}</Text>
                      </View>
                      <View style={[styles.myStyleBadge, { backgroundColor: '#7C3AED20' }]}>
                        <Ionicons name={locationIcon(cs.location)} size={14} color="#7C3AED" />
                        <Text style={[styles.myStyleBadgeText, { color: '#7C3AED' }]}>{locationLabel(cs.location)}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: Spacing.xxl }} />
            </View>
          )}
        </ScrollView>

        {/* Floating Configuration Button */}
        {activeTab === 'catalog' && selectedStyleIds.length > 0 && (
          <View style={[styles.floatingAction, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.batchConfigBtn, { backgroundColor: '#191919' }]}
              onPress={startBatchConfiguration}
              activeOpacity={0.9}
            >
              <View style={styles.batchBadge}>
                <Text style={styles.batchBadgeText}>{selectedStyleIds.length}</Text>
              </View>
              <Text style={styles.batchConfigBtnText}>
                {selectedStyleIds.length > 1 ? 'Configurer les styles' : 'Configurer le style'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── MODAL CONFIGURATION PAR LOT ─────────────────────────────────────── */}
      <Modal
        visible={isBatchConfiguring}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsBatchConfiguring(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsBatchConfiguring(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Configuration ({selectedStyleIds.length})
            </Text>
            <TouchableOpacity onPress={handleSaveBatch}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.batchIntro, { color: colors.textSecondary }]}>
              Définissez vos tarifs et durées pour chaque style sélectionné.
            </Text>

            {selectedStyleIds.map((id, index) => {
              const data = batchData[id];
              const styleEntry = STYLE_CATALOG.flatMap(c => c.styles).find(s => s.id === id);
              if (!data || !styleEntry) return null;

              return (
                <View key={id} style={[styles.batchItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.batchItemHeader}>
                    <Image source={styleEntry.image} style={styles.batchItemImage} contentFit="cover" />
                    <View style={styles.batchItemTitleWrap}>
                      <Text style={[styles.batchItemName, { color: colors.text }]}>{styleEntry.name}</Text>
                      <TouchableOpacity 
                        style={styles.batchItemRemove} 
                        onPress={() => setSelectedStyleIds(prev => prev.filter(sid => sid !== id))}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.batchItemForm}>
                    <View style={styles.batchRow}>
                      <View style={styles.batchField}>
                        <Text style={[styles.batchLabel, { color: colors.textSecondary }]}>Prix (€)</Text>
                        <TextInput
                          style={[styles.batchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="ex: 80"
                          value={data.price}
                          onChangeText={(val) => updateBatchItem(id, { price: val })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.batchField}>
                        <Text style={[styles.batchLabel, { color: colors.textSecondary }]}>Durée (min)</Text>
                        <TextInput
                          style={[styles.batchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="ex: 120"
                          value={data.duration}
                          onChangeText={(val) => updateBatchItem(id, { duration: val })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.batchField}>
                      <Text style={[styles.batchLabel, { color: colors.textSecondary }]}>Lieu</Text>
                      <View style={styles.batchLocationRow}>
                        {(['salon', 'domicile', 'both'] as ServiceLocation[]).map((loc) => (
                          <TouchableOpacity
                            key={loc}
                            style={[
                              styles.batchLocBtn,
                              { backgroundColor: colors.background, borderColor: colors.border },
                              data.location === loc && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => updateBatchItem(id, { location: loc })}
                          >
                            <Ionicons 
                              name={locationIcon(loc)} 
                              size={14} 
                              color={data.location === loc ? '#FFFFFF' : colors.textSecondary} 
                            />
                            <Text style={[
                              styles.batchLocText, 
                              { color: data.location === loc ? '#FFFFFF' : colors.textSecondary }
                            ]}>
                              {loc === 'salon' ? 'Salon' : loc === 'domicile' ? 'Domi.' : 'Les 2'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TextInput
                      style={[styles.batchNoteInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Note ou précision (optionnel)"
                      value={data.customDescription}
                      onChangeText={(val) => updateBatchItem(id, { customDescription: val })}
                      multiline
                    />
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 2,
    borderRadius: 2,
  },

  /* Catalogue */
  catalogContainer: { padding: Spacing.md },
  catalogHint: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  categorySection: { marginBottom: Spacing.lg },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    flex: 1,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  styleChip: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    minWidth: 100,
    maxWidth: '47%',
    flex: 1,
  },
  styleChipImage: {
    width: '100%',
    height: 100,
  },
  styleChipContent: {
    padding: Spacing.sm,
  },
  styleChipTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  styleCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  styleChipName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  styleChipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  styleChipMetaText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  styleChipLocBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleChipSavedBadge: {
    backgroundColor: '#22C55E15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  styleChipSavedText: {
    fontSize: 9,
    color: '#22C55E',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  /* Floating Action */
  floatingAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  batchConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  batchConfigBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  batchBadge: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchBadgeText: {
    color: '#191919',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Mes styles */
  myStylesContainer: { padding: Spacing.md },
  myStyleCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  myStyleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myStyleImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  myStyleInfo: { flex: 1 },
  myStyleName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  myStyleCategory: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  myStyleDesc: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  myStyleActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  myStyleEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStyleDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStyleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  myStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  myStyleBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  /* Modal */
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: FontSizes.md },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  batchIntro: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  batchItem: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  batchItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  batchItemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  batchItemTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchItemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  batchItemRemove: {
    padding: 4,
  },
  batchItemForm: {
    gap: Spacing.md,
  },
  batchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  batchField: {
    flex: 1,
  },
  batchLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  batchInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  batchLocationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchLocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  batchLocText: {
    fontSize: 12,
    fontWeight: '600',
  },
  batchNoteInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    height: 60,
    textAlignVertical: 'top',
  },
  formGroup: { marginBottom: Spacing.lg },
  formLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  formHint: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  locationPicker: {
    gap: Spacing.sm,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  locationOptionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  locationOptionDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Auth prompt */
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  authMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  authButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  authLink: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
