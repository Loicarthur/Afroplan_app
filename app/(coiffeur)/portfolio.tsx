/**
 * Page Portfolio / Réalisations - Espace Coiffeur AfroPlan
 * Permet au coiffeur de poster ses "Coiffures du jour"
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as base64js from 'base64-js';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import { salonService } from '@/services/salon.service';

// Import sécurisé pour expo-video
let useVideoPlayer: any;
let VideoView: any;
try {
  const ExpoVideo = require('expo-video');
  useVideoPlayer = ExpoVideo.useVideoPlayer;
  VideoView = ExpoVideo.VideoView;
} catch (e) {
  console.warn('Native module ExpoVideo not found. Video features will be disabled.');
}

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = (width - Spacing.md * 3) / 2;

interface Realization {
  id: string;
  image_url: string;
  caption: string;
  style_category: string;
  created_at: string;
}

function PortfolioVideoItem({ url, autoPlay = false, useControls = false }: { url: string, autoPlay?: boolean, useControls?: boolean }) {
  if (!useVideoPlayer || !VideoView) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="videocam-outline" size={40} color="#FFF" />
      </View>
    );
  }

  try {
    const player = useVideoPlayer(url, (player: any) => {
      player.loop = true;
      if (autoPlay) player.play();
    });

    return (
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={useControls}
        allowsFullscreen={true}
      />
    );
  } catch (error) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={40} color="#FFF" />
      </View>
    );
  }
}

export default function CoiffeurPortfolioScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();

  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [filteredRealizations, setFilteredRealizations] = useState<Realization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Realization | null>(null);
  
  const [newMedia, setNewMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(HAIRSTYLE_CATEGORIES[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const loadRealizations = useCallback(async () => {
    if (!user) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const gallery = await salonService.getSalonGallery(salon.id);
        const formatted: Realization[] = (gallery || []).map(img => {
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
  }, [user, activeFilter]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        loadRealizations();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, isAuthLoading, loadRealizations]);

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
    try {
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
            text: t('coiffeur.camera'),
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(t('common.error'), t('coiffeur.cameraDenied'));
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                ...options,
                mediaTypes: ['images'],
              });
              if (!result.canceled && result.assets[0]) {
                setNewMedia({ uri: result.assets[0].uri, type: 'image' });
              }
            },
          },
          {
            text: 'Enregistrer une vidéo',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(t('common.error'), t('coiffeur.cameraDenied'));
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                ...options,
                mediaTypes: ['videos'],
              });
              if (!result.canceled && result.assets[0]) {
                setNewMedia({ uri: result.assets[0].uri, type: 'video' });
              }
            },
          },
          {
            text: t('coiffeur.gallery'),
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync(options);
              if (!result.canceled && result.assets[0]) {
                setNewMedia({ 
                  uri: result.assets[0].uri, 
                  type: result.assets[0].type === 'video' ? 'video' : 'image' 
                });
              }
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    } catch (e) {
      console.warn('Error picking media:', e);
    }
  };

  const handleSave = async () => {
    if (!newMedia || !user) {
      Alert.alert(t('common.error'), 'Veuillez sélectionner un média.');
      return;
    }

    setIsSaving(true);
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        let finalMediaUrl = newMedia.uri;
        
        if (!newMedia.uri.startsWith('http')) {
          const { supabase } = await import('@/lib/supabase');
          const extension = newMedia.uri.split('.').pop()?.toLowerCase() || (newMedia.type === 'video' ? 'mp4' : 'jpg');
          const fileName = `${user.id}/portfolio_${Date.now()}.${extension}`;
          
          const contentType = newMedia.type === 'video' 
            ? `video/${extension === 'mov' ? 'quicktime' : 'mp4'}` 
            : `image/${extension === 'png' ? 'png' : 'jpeg'}`;
          
          finalMediaUrl = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              const reader = new FileReader();
              reader.onloadend = async function () {
                try {
                  const base64 = (reader.result as string).split(',')[1];
                  const arrayBuffer = base64js.toByteArray(base64);
                  const { data, error } = await supabase.storage
                    .from('salon-photos')
                    .upload(fileName, arrayBuffer, { contentType, upsert: true });
                  if (error) { reject(new Error(`Erreur Supabase: ${error.message}`)); return; }
                  const { data: urlData } = supabase.storage.from('salon-photos').getPublicUrl(data.path);
                  resolve(urlData.publicUrl);
                } catch (err) { reject(err); }
              };
              reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => reject(new Error('Erreur lecture fichier.'));
            xhr.responseType = 'blob';
            xhr.open('GET', newMedia.uri, true);
            xhr.send(null);
          });
        }

        await salonService.addGalleryImage(salon.id, finalMediaUrl, `${selectedCategory}: ${newCaption}`);
        Alert.alert(t('common.success'), 'Votre réalisation a été ajoutée au portfolio !');
        setModalVisible(false);
        setNewMedia(null);
        setNewCaption('');
        loadRealizations();
      }
    } catch (error: any) {
      if (__DEV__) console.warn('Portfolio upload error:', error);
      Alert.alert(t('common.error'), "Impossible d'ajouter le média : " + (error.message || "Erreur réseau"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('common.delete'), 'Voulez-vous retirer cette réalisation de votre portfolio ?', [
      { text: t('common.cancel'), style: 'cancel' },
      { 
        text: t('common.delete'), 
        style: 'destructive', 
        onPress: async () => {
          try {
            await salonService.deleteGalleryImage(id);
            await loadRealizations();
          } catch (error) {
            Alert.alert(t('common.error'), 'Impossible de supprimer l\'image.');
          }
        } 
      },
    ]);
  };

  const isVideo = (url: string) => url.toLowerCase().match(/\.(mp4|mov|wmv|avi|quicktime)$/);

  if (isAuthLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Portfolio</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Connectez-vous pour gérer vos réalisations
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && { color: '#FFF' }]}>{t('common.seeAll')}</Text>
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
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
                title={t('coiffeur.addPhoto')} 
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
                  onPress={() => {
                    setSelectedMedia(item);
                    setViewerVisible(true);
                  }}
                  activeOpacity={0.9}
                >
                  {isVideo(item.image_url) ? (
                    <View style={styles.image}>
                      <PortfolioVideoItem url={item.image_url} />
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
                  )}
                  
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

      {/* MODAL AJOUT RÉALISATION */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle Réalisation</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Publier</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity 
              style={[styles.imagePicker, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} 
              onPress={pickMedia}
            >
              {newMedia ? (
                newMedia.type === 'video' ? (
                  <View style={styles.previewImage}>
                    <PortfolioVideoItem url={newMedia.uri} />
                  </View>
                ) : (
                  <Image source={{ uri: newMedia.uri }} style={styles.previewImage} />
                )
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 8 }}>{t('coiffeur.addPhoto')}</Text>
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

      {/* VISIONNEUSE PLEIN ÉCRAN */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.viewerMedia}>
            {selectedMedia && (
              isVideo(selectedMedia.image_url) ? (
                <PortfolioVideoItem url={selectedMedia.image_url} autoPlay={true} useControls={true} />
              ) : (
                <Image source={{ uri: selectedMedia.image_url }} style={styles.fullImage} contentFit="contain" />
              )
            )}
          </View>

          {selectedMedia && (
            <View style={styles.viewerFooter}>
              <Text style={styles.viewerCategory}>{selectedMedia.style_category}</Text>
              <Text style={styles.viewerCaption}>{selectedMedia.caption || 'Aucune description'}</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  filterSection: { paddingBottom: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.md, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridItem: { width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.2, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: '#E5E5E5' },
  image: { width: '100%', height: '100%' },
  videoIndicator: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(25,25,25,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  itemOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  itemCaption: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  loginButton: { backgroundColor: '#191919', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginTop: 20 },
  loginButtonText: { color: '#FFF', fontWeight: '700' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalContent: { padding: Spacing.md },
  imagePicker: { width: '100%', aspectRatio: 1, borderRadius: BorderRadius.xl, borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden', marginBottom: Spacing.xl },
  previewImage: { width: '100%', height: '100%' },
  pickerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  formSection: { marginBottom: Spacing.xl },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  categoryScroll: { flexDirection: 'row' },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  input: { borderRadius: BorderRadius.md, borderWidth: 1, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  // Viewer styles
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  viewerMedia: { width: '100%', height: SCREEN_HEIGHT * 0.7 },
  fullImage: { width: '100%', height: '100%' },
  viewerFooter: { position: 'absolute', bottom: 50, left: 0, right: 0, padding: 20 },
  viewerCategory: { color: '#FFF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 },
  viewerCaption: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
