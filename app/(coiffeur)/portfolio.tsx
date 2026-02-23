/**
 * Page Portfolio / Réalisations - Espace Coiffeur AfroPlan
 * Permet au coiffeur de poster ses "Coiffures du jour"
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
// Import sécurisé de expo-av
let Video: any = null;
let ResizeMode: any = { COVER: 'cover', CONTAIN: 'contain' };
try {
  const ExpoAV = require('expo-av');
  Video = ExpoAV.Video;
  ResizeMode = ExpoAV.ResizeMode;
} catch (e) {
  console.warn("Module expo-av non chargé sur cet appareil.");
}
import * as ImagePicker from 'expo-image-picker';
import * as base64js from 'base64-js';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { salonService } from '@/services/salon.service';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - Spacing.md * 3) / 2;

interface Realization {
  id: string;
  image_url: string;
  caption: string;
  style_category: string;
  created_at: string;
}

export default function CoiffeurPortfolioScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [filteredRealizations, setFilteredRealizations] = useState<Realization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(HAIRSTYLE_CATEGORIES[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRealizations();
  }, []);

  const loadRealizations = async () => {
    if (!user) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const gallery = await salonService.getSalonGallery(salon.id);
        const formatted: Realization[] = (gallery || []).map(img => {
          // Format attendu de la légende : "category_id: description"
          const separatorIndex = img.caption?.indexOf(': ') ?? -1;
          const catId = separatorIndex !== -1 ? img.caption!.substring(0, separatorIndex) : (img.caption || '');
          const desc = separatorIndex !== -1 ? img.caption!.substring(separatorIndex + 2) : '';
          
          const categoryObj = HAIRSTYLE_CATEGORIES.find(c => c.id === catId);
          
          return {
            id: img.id,
            image_url: img.image_url,
            caption: desc,
            style_category: categoryObj?.title || 'Style',
            created_at: img.created_at,
          };
        });
        setRealizations(formatted);
        
        // Appliquer le filtre actuel immédiatement après le chargement
        if (activeFilter === 'all') {
          setFilteredRealizations(formatted);
        } else {
          setFilteredRealizations(formatted.filter(r => r.style_category === activeFilter));
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Load portfolio error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRealizations();
  };

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRealizations(realizations);
    } else {
      setFilteredRealizations(realizations.filter(r => r.style_category === activeFilter));
    }
  }, [activeFilter, realizations]);

  const pickMedia = async () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    Alert.alert(
      'Ajouter une réalisation',
      'Quelle source souhaitez-vous utiliser ?',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission requise', 'Accès caméra refusé');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              ...options,
              mediaTypes: ['images'],
            });
            if (!result.canceled) setNewImage(result.assets[0].uri);
          },
        },
        {
          text: 'Enregistrer une vidéo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission requise', 'Accès caméra refusé');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              ...options,
              mediaTypes: ['videos'],
            });
            if (!result.canceled) setNewImage(result.assets[0].uri);
          },
        },
        {
          text: 'Choisir dans la galerie',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled) setNewImage(result.assets[0].uri);
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!newImage || !user) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image.');
      return;
    }

    setIsSaving(true);
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        // Upload de l'image vers Supabase Storage
        let finalImageUrl = newImage;
        
        if (!newImage.startsWith('http')) {
          const { supabase } = await import('@/lib/supabase');
          const extension = newImage.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${user.id}/portfolio_${Date.now()}.${extension}`;
          
          // Détection du type de contenu
          const isVideo = ['mp4', 'mov', 'avi', 'wmv'].includes(extension);
          const contentType = isVideo ? `video/${extension === 'mov' ? 'quicktime' : extension}` : `image/${extension === 'png' ? 'png' : 'jpeg'}`;
          
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              const reader = new FileReader();
              reader.onloadend = async function () {
                try {
                  const base64 = (reader.result as string).split(',')[1];
                  // Utilisation explicite de base64js.toByteArray
                  const arrayBuffer = base64js.toByteArray(base64);

                  const { data, error } = await supabase.storage
                    .from('salon-photos')
                    .upload(fileName, arrayBuffer, {
                      contentType,
                      upsert: true
                    });

                  if (error) {
                    reject(new Error(`Erreur Supabase: ${error.message}`));
                    return;
                  }
                  
                  const { data: urlData } = supabase.storage.from('salon-photos').getPublicUrl(data.path);
                  resolve(urlData.publicUrl);
                } catch (err) {
                  reject(err);
                }
              };
              reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => reject(new Error('Erreur lecture fichier.'));
            xhr.responseType = 'blob';
            xhr.open('GET', newImage, true);
            xhr.send(null);
          });
        }

        await salonService.addGalleryImage(salon.id, finalImageUrl, `${selectedCategory}: ${newCaption}`);
        
        Alert.alert('Succès', 'Votre réalisation a été ajoutée au portfolio !');
        setModalVisible(false);
        setNewImage(null);
        setNewCaption('');
        loadRealizations();
      }
    } catch (error: any) {
      if (__DEV__) console.warn('Portfolio upload error:', error);
      Alert.alert('Erreur', "Impossible d'ajouter l'image : " + (error.message || "Erreur réseau"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous retirer cette réalisation de votre portfolio ?', [
      { text: 'Annuler', style: 'cancel' },
      { 
        text: 'Supprimer', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await salonService.deleteGalleryImage(id);
            await loadRealizations();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer l\'image.');
          }
        } 
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Vos plus belles réalisations</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Barre de filtres */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && { color: '#FFF' }]}>Tout</Text>
          </TouchableOpacity>
          {HAIRSTYLE_CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[styles.filterChip, activeFilter === cat.title && { backgroundColor: colors.primary }]}
              onPress={() => setActiveFilter(cat.title)}
            >
              <Text style={[styles.filterText, activeFilter === cat.title && { color: '#FFF' }]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement du portfolio...</Text>
          </View>
        ) : filteredRealizations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="images-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {activeFilter === 'all' ? 'Votre portfolio est vide' : `Aucune réalisation en ${activeFilter}`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Partagez vos coiffures du jour pour attirer de nouveaux clients !
            </Text>
            {activeFilter === 'all' && (
              <Button 
                title="Ajouter ma première photo" 
                onPress={() => setModalVisible(true)}
                style={{ marginTop: Spacing.lg }}
              />
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredRealizations.map((item, index) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInUp.delay(index * 100).duration(400)}
                style={styles.gridItem}
              >
                <TouchableOpacity 
                  onLongPress={() => handleDelete(item.id)}
                  activeOpacity={0.9}
                >
                  {item.image_url.toLowerCase().match(/\.(mp4|mov|wmv|avi|quicktime)$/) ? (
                    <View style={styles.image}>
                      {Video ? (
                        <Video
                          source={{ uri: item.image_url }}
                          style={StyleSheet.absoluteFill}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                        />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="videocam" size={32} color="#FFF" />
                        </View>
                      )}
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
                  )}
                  
                  {/* Badge de catégorie */}
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.style_category}</Text>
                  </View>

                  <View style={[styles.itemOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <Text style={styles.itemCaption} numberOfLines={1}>
                      {item.caption || 'Sans description'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Ajout Réalisation */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle Réalisation</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Publier</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity 
              style={[styles.imagePicker, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} 
              onPress={pickMedia}
            >
              {newImage ? (
                newImage.toLowerCase().match(/\.(mp4|mov|wmv|avi|quicktime)$/) ? (
                  Video ? (
                    <Video
                      source={{ uri: newImage }}
                      style={styles.previewImage}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping
                    />
                  ) : (
                    <View style={[styles.previewImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="videocam" size={48} color="#FFF" />
                      <Text style={{ color: '#FFF', marginTop: 10 }}>Vidéo sélectionnée</Text>
                    </View>
                  )
                ) : (
                  <Image source={{ uri: newImage }} style={styles.previewImage} />
                )
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 8 }}>Prendre ou choisir un média</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>Style réalisé</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {HAIRSTYLE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedCategory === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? '#FFFFFF' : colors.textSecondary }]}>
                      {cat.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>Description libre (optionnel)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Tresses sans noeuds sur cheveux crépus..."
                placeholderTextColor={colors.textMuted}
                value={newCaption}
                onChangeText={setNewCaption}
                multiline
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  filterSection: {
    paddingBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(25,25,25,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  itemCaption: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: Spacing.md,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
