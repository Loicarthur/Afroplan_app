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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as base64js from 'base64-js';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES, findStyleById } from '@/constants/hairstyleCategories';
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
  customImage?: string; // Nouvelle photo choisie par le coiffeur
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
  const [isPublished, setIsPublished] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfiguredStyles = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        setSalonId(salon.id);
        setIsPublished(salon.is_active === true);
        const services = await salonService.getSalonServices(salon.id);
        const mapped: ConfiguredStyle[] = services.map(s => {
          // Recherche insensible à la casse dans le catalogue pour retrouver l'image
          const catalogStyle = HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).find(cs => 
            cs.name.toLowerCase() === s.name.toLowerCase()
          );
          
          return {
            styleId: s.id,
            styleName: s.name,
            categoryLabel: s.category,
            price: s.price.toString(),
            duration: s.duration_minutes.toString(),
            location: s.service_location as ServiceLocation,
            requiresExtensions: s.requires_extensions,
            extensionsIncluded: s.extensions_included,
            image: catalogStyle?.image,
            customImage: s.image_url || undefined,
            customDescription: s.description || '',
          };
        });
        setConfiguredStyles(mapped);
      }
    } catch (error) {
      console.error('Erreur chargement services:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadConfiguredStyles();
    }
  }, [isAuthenticated, loadConfiguredStyles]);

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
        // Trouver l'entrée du style et sa catégorie parente
        let parentCategoryLabel = '';
        let styleEntry = null;
        
        for (const cat of STYLE_CATALOG) {
          const found = cat.styles.find(s => s.id === id);
          if (found) {
            styleEntry = found;
            parentCategoryLabel = cat.label;
            break;
          }
        }

        initialData[id] = {
          styleId: id,
          styleName: styleEntry?.name || 'Style inconnu',
          categoryLabel: parentCategoryLabel,
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

  const pickServiceImage = async (styleId: string) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };

    Alert.alert(
      'Photo de la prestation',
      'Comment souhaitez-vous ajouter la photo ?',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission requise', 'Accès caméra refusé');
              return;
            }
            const result = await ImagePicker.launchCameraAsync(options);
            if (!result.canceled) updateBatchItem(styleId, { customImage: result.assets[0].uri });
          },
        },
        {
          text: 'Choisir dans la galerie',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled) updateBatchItem(styleId, { customImage: result.assets[0].uri });
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleSaveBatch = async () => {
    if (!user) return;

    // Validation : on ne valide que les styles actuellement sélectionnés dans la liste
    const stylesToSave = selectedStyleIds
      .map(id => batchData[id])
      .filter(s => !!s) as ConfiguredStyle[];
    
    const invalid = stylesToSave.find(s => !s.price || !s.duration);
    
    if (invalid) {
      Alert.alert('Champs requis', 'Veuillez renseigner le prix et la durée pour tous les styles sélectionnés.');
      return;
    }

    setIsSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      let salon = await salonService.getSalonByOwnerId(user.id);
      
      if (!salon) {
        Alert.alert('Erreur', 'Aucun salon associé à ce compte.');
        setIsSaving(false);
        return;
      }

      // 1. Filtrer pour ne pas ajouter des styles qui existent déjà
      const newStylesToSave = stylesToSave.filter(style => {
        const alreadyExists = configuredStyles.some(
          existing => existing.styleName.toLowerCase() === style.styleName.toLowerCase()
        );
        return !alreadyExists;
      });

      if (newStylesToSave.length === 0 && stylesToSave.length > 0) {
        Alert.alert('Info', 'Tous les styles sélectionnés sont déjà présents dans vos prestations.');
        setIsSaving(false);
        setIsBatchConfiguring(false);
        setSelectedStyleIds([]);
        return;
      }

      // 3. Upload des images et préparation du payload
      const servicesPayload = [];
      
      for (const style of newStylesToSave) {
        // On garde l'image actuelle par défaut
        let finalImageUrl = style.customImage || null;

        // Si une NOUVELLE photo locale a été choisie, on l'uploade via ArrayBuffer (stable)
        if (style.customImage && !style.customImage.startsWith('http')) {
          const extension = style.customImage.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${user.id}/service_${Date.now()}.${extension}`;
          
          const uploadUrl = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              const reader = new FileReader();
              reader.onloadend = async function () {
                try {
                  const base64 = (reader.result as string).split(',')[1];
                  const arrayBuffer = base64js.toByteArray(base64);

                  const { data, error } = await supabase.storage
                    .from('salon-photos')
                    .upload(fileName, arrayBuffer, {
                      contentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
                      upsert: true
                    });

                  if (error) throw error;
                  
                  const { data: urlData } = supabase.storage.from('salon-photos').getPublicUrl(data.path);
                  resolve(urlData.publicUrl);
                } catch (err) {
                  reject(err);
                }
              };
              reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => reject(new Error('Erreur lecture photo service.'));
            xhr.responseType = 'blob';
            xhr.open('GET', style.customImage!, true);
            xhr.send(null);
          });
          finalImageUrl = uploadUrl;
        }

        let categoryName = style.categoryLabel;
        if (!categoryName) {
          const found = findStyleById(style.styleId);
          categoryName = found?.category.title || 'Autre';
        }

        servicesPayload.push({
          salon_id: salon!.id,
          name: style.styleName,
          category: categoryName,
          price: parseFloat(style.price),
          duration_minutes: parseInt(style.duration, 10),
          description: style.customDescription || null,
          service_location: style.location,
          image_url: finalImageUrl, // URL conservée ou nouvelle
          is_active: true,
        });
      }

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

    } catch (error: any) {
      if (__DEV__) console.error('Save Batch Error:', error);
      Alert.alert(
        'Erreur', 
        `Impossible de sauvegarder : ${error?.message || 'Vérifiez votre connexion.'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishSalon = async () => {
    if (!salonId) return;
    
    if (configuredStyles.length === 0) {
      Alert.alert('Impossible', 'Vous devez configurer au moins un service avant de publier votre salon.');
      return;
    }

    Alert.alert(
      'Publier votre salon',
      'Votre salon sera visible par tous les clients AfroPlan. Souhaitez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui, publier', 
          onPress: async () => {
            try {
              setIsSaving(true);
              await salonService.updateSalon(salonId, { is_active: true });
              setIsPublished(true);
              Alert.alert(
                'Félicitations ! 🎉', 
                'Votre salon est désormais en ligne et prêt à recevoir des réservations.',
                [{ text: 'Super !', onPress: () => router.push('/(coiffeur)') }]
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de publier le salon pour le moment.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
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
          onPress: async () => {
            try {
              // Si c'est un UUID (déjà en base), on le supprime
              if (styleId.length > 20) {
                await salonService.deleteService(styleId);
              }
              setConfiguredStyles((prev) => prev.filter((s) => s.styleId !== styleId));
              loadConfiguredStyles();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le service.');
            }
          }
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
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Chargement de vos prestations...</Text>
      </SafeAreaView>
    );
  }

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
              {configuredStyles.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity 
                    style={[styles.addPrestationBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '08' }]}
                    onPress={() => setActiveTab('catalog')}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.addPrestationText, { color: colors.primary }]}>Ajouter d&apos;autres prestations</Text>
                  </TouchableOpacity>

                  <View style={[styles.boostBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                    <View style={styles.boostIcon}>
                      <Ionicons name="flash" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.boostContent}>
                      <Text style={[styles.boostTitle, { color: colors.text }]}>Boostez vos réservations ! 🚀</Text>
                      <Text style={[styles.boostText, { color: colors.textSecondary }]}>
                        Les coiffeurs avec leurs <Text style={{ fontWeight: '700' }}>propres photos</Text> reçoivent en moyenne <Text style={{ color: colors.primary, fontWeight: '700' }}>3x plus de demandes</Text>.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

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

              <View style={{ height: 100 }} />
            </View>
          )}
        </ScrollView>

        {/* Global Publication Button - Fixed at bottom of tab content */}
        {activeTab === 'my_styles' && salonId && (
          <View style={[styles.bottomPublishContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {!isPublished ? (
              <TouchableOpacity 
                style={[styles.mainPublishBtn, { backgroundColor: colors.primary }]}
                onPress={handlePublishSalon}
                disabled={isSaving}
              >
                <Ionicons name="rocket" size={20} color="#FFFFFF" />
                <Text style={styles.mainPublishBtnText}>
                  {configuredStyles.length > 0 ? 'PUBLIER MON SALON MAINTENANT' : 'SERVICES REQUIS POUR PUBLIER'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.onlineStatusRow}>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>SALON EN LIGNE</Text>
                </View>
                <TouchableOpacity 
                  onPress={async () => {
                    Alert.alert('Retirer de la publication ?', 'Votre salon ne sera plus visible.', [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Oui, dépublier', style: 'destructive', onPress: async () => {
                        try {
                          setIsSaving(true);
                          await salonService.updateSalon(salonId, { is_active: false });
                          setIsPublished(false);
                          Alert.alert('Succès', 'Votre salon est hors ligne.');
                        } catch (e) { Alert.alert('Erreur', 'Impossible de modifier le statut.'); }
                        finally { setIsSaving(false); }
                      }}
                    ]);
                  }}
                >
                  <Text style={{ color: colors.error, fontWeight: '600', fontSize: 13 }}>Dépublier</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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
            <TouchableOpacity onPress={handleSaveBatch} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.batchIntro, { color: colors.textSecondary }]}>
              Définissez vos tarifs, durées et ajoutez une photo pour chaque style.
            </Text>

            {selectedStyleIds.map((id, index) => {
              const data = batchData[id];
              const styleEntry = STYLE_CATALOG.flatMap(c => c.styles).find(s => s.id === id);
              if (!data || !styleEntry) return null;

              return (
                <View key={id} style={[styles.batchItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.batchItemHeader}>
                    {/* Sélecteur d'image personnalisé */}
                    <TouchableOpacity 
                      style={styles.batchItemImageContainer} 
                      onPress={() => pickServiceImage(id)}
                    >
                      <Image 
                        source={data.customImage ? { uri: data.customImage } : styleEntry.image} 
                        style={[styles.batchItemImage, data.customImage && { borderColor: colors.primary, borderWidth: 2 }]} 
                        contentFit="cover" 
                      />
                      <View style={styles.imageEditBadge}>
                        <Ionicons name="camera" size={12} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.batchItemTitleWrap}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.batchItemName, { color: colors.text }]}>{styleEntry.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                          {data.customImage ? '✅ Photo réelle de votre travail' : 'ℹ️ Photo catalogue (remplacez-la !)'}
                        </Text>
                      </View>
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

  /* Boost Banner */
  boostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  addPrestationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addPrestationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  unpublishBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpublishText: {
    fontSize: 14,
    fontWeight: '600',
  },
  boostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  boostContent: {
    flex: 1,
  },
  boostTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  boostText: {
    fontSize: 12,
    lineHeight: 18,
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
  batchItemImageContainer: {
    position: 'relative',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#191919',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  /* Publication Banner */
  publishAction: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  publishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 15,
  },
  publishTextContainer: {
    flex: 1,
  },
  publishTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  publishSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
  /* Fixed Bottom Publish Button */
  bottomPublishContainer: {
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  mainPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainPublishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '800',
  },
});
