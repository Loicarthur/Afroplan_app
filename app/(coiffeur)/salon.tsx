/**
 * Page de gestion du salon - Espace Coiffeur AfroPlan
 * Gère uniquement les informations de base du salon
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
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as base64js from 'base64-js';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService } from '@/services/salon.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

type SalonLocationType = 'salon' | 'coiffeur_home' | 'domicile' | 'both';

// Opening hours structure
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi', labelEn: 'Monday' },
  { key: 'tuesday', label: 'Mardi', labelEn: 'Tuesday' },
  { key: 'wednesday', label: 'Mercredi', labelEn: 'Wednesday' },
  { key: 'thursday', label: 'Jeudi', labelEn: 'Thursday' },
  { key: 'friday', label: 'Vendredi', labelEn: 'Friday' },
  { key: 'saturday', label: 'Samedi', labelEn: 'Saturday' },
  { key: 'sunday', label: 'Dimanche', labelEn: 'Sunday' },
];

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

type OpeningHours = Record<string, DayHours>;

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '09:00', close: '19:00', closed: false },
  tuesday: { open: '09:00', close: '19:00', closed: false },
  wednesday: { open: '09:00', close: '19:00', closed: false },
  thursday: { open: '09:00', close: '19:00', closed: false },
  friday: { open: '09:00', close: '19:00', closed: false },
  saturday: { open: '09:00', close: '18:00', closed: false },
  sunday: { open: '09:00', close: '18:00', closed: true },
};

export default function SalonManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [existingSalonId, setExistingSalonId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  // Informations du salon
  const [salonName, setSalonName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Médias du salon
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  // Opening hours
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);

  // Lieu de prestation du salon
  const [serviceLocationType, setServiceLocationType] = useState<SalonLocationType>('salon');
  const [homeServiceFee, setHomeServiceFee] = useState('');

  const email = user?.email || '';

  const loadExistingSalon = async () => {
    if (!user?.id || !isSupabaseConfigured()) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        setExistingSalonId(salon.id);
        setSalonName(salon.name || '');
        setDescription(salon.description || '');
        setPhone(salon.phone || '');
        setAddress(salon.address || '');
        setCity(salon.city || '');
        setPostalCode(salon.postal_code || '');
        setIsPublished(salon.is_active === true);
        
        const initialCover = salon.cover_image_url || salon.image_url || (salon.photos && salon.photos.length > 0 ? salon.photos[0] : null);
        if (initialCover) setCoverPhoto(initialCover);
        
        if (salon.photos && salon.photos.length > 0) {
          const galleryStartIdx = (salon.photos[0] === initialCover) ? 1 : 0;
          setGalleryPhotos(salon.photos.slice(galleryStartIdx, galleryStartIdx + 2));
        }
        
        if (salon.service_location) setServiceLocationType(salon.service_location as any);
        else if (salon.offers_home_service) setServiceLocationType('both');
        
        if (salon.opening_hours) setOpeningHours(salon.opening_hours as unknown as OpeningHours);
      }
    } catch (e) {
      console.warn('Error loading salon:', e);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadExistingSalon();
    setRefreshing(false);
  }, [user?.id]);

  React.useEffect(() => {
    loadExistingSalon();
  }, [user?.id]);

  const pickMedia = async (type: 'cover' | 'gallery', index?: number) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      };

      Alert.alert(
        'Ajouter une photo',
        'Choisissez la source',
        [
          {
            text: 'Appareil photo',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission requise', 'Accès caméra refusé');
                return;
              }
              const result = await ImagePicker.launchCameraAsync(options);
              if (!result.canceled && result.assets[0]) {
                handleMediaSelection(result.assets[0].uri, type, index);
              }
            },
          },
          {
            text: 'Galerie',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission requise', 'Accès galerie refusé');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync(options);
              if (!result.canceled && result.assets[0]) {
                handleMediaSelection(result.assets[0].uri, type, index);
              }
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    } catch (e) {
      if (__DEV__) console.warn('Media pick error:', e);
    }
  };

  const handleMediaSelection = (uri: string, type: 'cover' | 'gallery', index?: number) => {
    if (type === 'cover') {
      setCoverPhoto(uri);
    } else if (type === 'gallery') {
      const newGallery = [...galleryPhotos];
      if (index !== undefined && index < newGallery.length) {
        newGallery[index] = uri;
      } else if (newGallery.length < 2) {
        newGallery.push(uri);
      }
      setGalleryPhotos(newGallery);
    }
  };

  const removeMedia = (type: 'cover' | 'gallery', index?: number) => {
    if (type === 'cover') setCoverPhoto(null);
    else if (type === 'gallery') setGalleryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!salonName.trim() || !address.trim() || !city.trim() || !postalCode.trim() || !phone.trim()) {
      Alert.alert(t('common.error'), 'Veuillez remplir tous les champs obligatoires (*)');
      return;
    }
    if (!user?.id) return;

    setIsSaving(true);

    try {
      const uploadFile = async (uri: string, prefix: string) => {
        if (uri.startsWith('http')) return uri;
        const base64: string = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(xhr.response);
          };
          xhr.onerror = () => reject(new Error('Read error'));
          xhr.open('GET', uri);
          xhr.responseType = 'blob';
          xhr.send();
        });

        const arrayBuffer = base64js.toByteArray(base64);
        const fileName = `${user.id}/${prefix}_${Date.now()}.jpg`;
        const { data, error } = await supabase.storage.from('salon-photos').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        return supabase.storage.from('salon-photos').getPublicUrl(data.path).data.publicUrl;
      };

      let finalCoverUrl = coverPhoto ? await uploadFile(coverPhoto, 'cover') : null;
      const finalGalleryUrls = [];
      for (const uri of galleryPhotos) {
        finalGalleryUrls.push(await uploadFile(uri, 'gallery'));
      }

      const allPhotos = finalCoverUrl ? [finalCoverUrl, ...finalGalleryUrls] : finalGalleryUrls;

      const salonPayload = {
        name: salonName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email,
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        cover_image_url: finalCoverUrl,
        image_url: finalCoverUrl,
        photos: allPhotos,
        opening_hours: openingHours,
        offers_home_service: serviceLocationType === 'domicile' || serviceLocationType === 'both',
        service_location: serviceLocationType === 'coiffeur_home' ? 'salon' : serviceLocationType,
        min_home_service_amount: (serviceLocationType === 'domicile' || serviceLocationType === 'both') ? parseFloat(homeServiceFee || '0') : 0,
        owner_id: user.id,
        is_active: isPublished
      };

      if (existingSalonId) {
        await salonService.updateSalon(existingSalonId, salonPayload as any);
      } else {
        const newSalon = await salonService.createSalon(salonPayload as any);
        setExistingSalonId(newSalon.id);
      }

      Alert.alert('Succès', 'Informations du salon enregistrées !', [
        { text: 'OK' },
        { text: 'Gérer mes tarifs', onPress: () => router.push('/(coiffeur)/services') }
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="storefront" size={64} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon salon</Text>
          <Button title="Se connecter" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Photo de couverture</Text>
          <TouchableOpacity style={[styles.coverPhotoCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => pickMedia('cover')}>
            {coverPhoto ? (
              <View style={styles.photoWrapper}>
                <Image source={{ uri: coverPhoto }} style={styles.photo} contentFit="cover" />
                <TouchableOpacity style={[styles.removeBadge, { backgroundColor: colors.error }]} onPress={() => removeMedia('cover')}>
                  <Ionicons name="trash" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted }}>Ajouter une photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations générales</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Nom du salon *" value={salonName} onChangeText={setSalonName} />
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginTop: 10 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
          <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, marginTop: 10 }]} placeholder="Téléphone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Localisation</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Adresse *" value={address} onChangeText={setAddress} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TextInput style={[styles.input, { flex: 2, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Ville *" value={city} onChangeText={setCity} />
            <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Code postal *" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Horaires d&apos;ouverture</Text>
          {DAYS_OF_WEEK.map(day => {
            const hours = openingHours[day.key];
            return (
              <View key={day.key} style={[styles.dayRow, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => updateDayHours(day.key, 'closed', !hours.closed)}
                >
                  <View style={[
                    { width: 20, height: 20, borderRadius: 4, borderWidth: 1, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
                    !hours.closed ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }
                  ]}>
                    {!hours.closed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={{ color: hours.closed ? colors.textMuted : colors.text, fontWeight: '500' }}>{day.label}</Text>
                </TouchableOpacity>

                {!hours.closed ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                      value={hours.open}
                      onChangeText={(v) => updateDayHours(day.key, 'open', v)}
                      placeholder="09:00"
                      keyboardType="numbers-and-punctuation"
                    />
                    <Text style={{ color: colors.textSecondary }}>-</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                      value={hours.close}
                      onChangeText={(v) => updateDayHours(day.key, 'close', v)}
                      placeholder="19:00"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                ) : (
                  <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 13 }}>Fermé</Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lieu de prestation</Text>
          <View style={{ gap: 10 }}>
            {(['salon', 'domicile', 'both'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
                  serviceLocationType === type ? { borderColor: colors.primary, backgroundColor: colors.primary + '10' } : { borderColor: colors.border }
                ]}
                onPress={() => setServiceLocationType(type)}
              >
                <Ionicons 
                  name={type === 'salon' ? 'storefront-outline' : type === 'domicile' ? 'car-outline' : 'repeat-outline'} 
                  size={20} 
                  color={serviceLocationType === type ? colors.primary : colors.textSecondary} 
                />
                <Text style={{ marginLeft: 10, flex: 1, color: colors.text, fontWeight: '500' }}>
                  {type === 'salon' ? 'Au salon' : type === 'domicile' ? 'Chez le client' : 'Les deux'}
                </Text>
                {serviceLocationType === type && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {(serviceLocationType === 'domicile' || serviceLocationType === 'both') && (
            <View style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5, color: colors.text }}>Frais de déplacement (€)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 10"
                value={homeServiceFee}
                onChangeText={setHomeServiceFee}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        <View style={{ padding: 20 }}>
          <Button title={isSaving ? "Enregistrement..." : "Enregistrer les modifications"} onPress={handleSave} loading={isSaving} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  coverPhotoCard: { width: '100%', height: 180, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden' },
  photoWrapper: { flex: 1 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  removeBadge: { position: 'absolute', top: 10, right: 10, padding: 5, borderRadius: 15 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dayRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#CCC', alignItems: 'center' },
  timeInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, width: 55, textAlign: 'center' },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  authTitle: { fontSize: 24, fontWeight: '700', marginTop: 10 },
});
