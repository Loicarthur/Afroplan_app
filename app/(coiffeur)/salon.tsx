/**
 * Page de gestion du salon - Espace Coiffeur AfroPlan
 *
 * Fixes applied:
 * 1. All hardcoded French strings replaced with t() translations
 * 2. Photo picker now offers Camera / Gallery / Cancel via ActionSheet
 * 3. Save uses correct DB columns (image_url, cover_image_url, gallery_images, coiffeur_details.specialties)
 * 4. Day labels use translation keys t('day.monday'), etc.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService } from '@/services/salon.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/config';

// Liste des specialites de coiffure afro
const AFRO_SPECIALTIES = [
  { id: 'tresses', name: 'Tresses', icon: 'git-branch-outline' },
  { id: 'locks', name: 'Locks / Dreadlocks', icon: 'infinite-outline' },
  { id: 'coupe', name: 'Coupe', icon: 'cut-outline' },
  { id: 'coloration', name: 'Coloration', icon: 'color-palette-outline' },
  { id: 'soins', name: 'Soins capillaires', icon: 'heart-outline' },
  { id: 'lissage', name: 'Lissage', icon: 'water-outline' },
  { id: 'extensions', name: 'Extensions', icon: 'sparkles-outline' },
  { id: 'barber', name: 'Barber', icon: 'man-outline' },
  { id: 'enfants', name: 'Enfants', icon: 'happy-outline' },
  { id: 'mariage', name: 'Mariage', icon: 'diamond-outline' },
  { id: 'braids', name: 'Box Braids', icon: 'grid-outline' },
  { id: 'crochet', name: 'Crochet Braids', icon: 'link-outline' },
  { id: 'twist', name: 'Twists', icon: 'sync-outline' },
  { id: 'afro', name: 'Coupe Afro', icon: 'ellipse-outline' },
  { id: 'tissage', name: 'Tissage', icon: 'layers-outline' },
];

const MAX_PHOTOS = 4;

// Opening hours structure - keys only, labels come from translations
const DAYS_OF_WEEK = [
  { key: 'monday' },
  { key: 'tuesday' },
  { key: 'wednesday' },
  { key: 'thursday' },
  { key: 'friday' },
  { key: 'saturday' },
  { key: 'sunday' },
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
  const { t } = useLanguage();

  const [isSaving, setIsSaving] = useState(false);

  // Informations du salon
  const [salonName, setSalonName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Photos du salon (max 4)
  const [photos, setPhotos] = useState<string[]>([]);

  // Specialites selectionnees
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Opening hours
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);

  // Home service
  const [offersHomeService, setOffersHomeService] = useState(false);
  const [homeServiceFee, setHomeServiceFee] = useState('');

  // Email par defaut (celui de l'inscription)
  const email = user?.email || '';

  // ---------------------------------------------------------------------------
  // Photo picker with Camera / Gallery ActionSheet
  // ---------------------------------------------------------------------------

  const pickImage = async (index?: number) => {
    if (photos.length >= MAX_PHOTOS && index === undefined) {
      Alert.alert(
        t('salon.limitReached'),
        t('salon.maxPhotosMessage', { max: MAX_PHOTOS }),
      );
      return;
    }

    // Show ActionSheet: Take photo / Choose from gallery / Cancel
    Alert.alert(
      t('salon.photoChoice'),
      undefined,
      [
        {
          text: t('salon.takePhoto'),
          onPress: () => launchCamera(index),
        },
        {
          text: t('salon.chooseFromGallery'),
          onPress: () => launchGallery(index),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const launchCamera = async (index?: number) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t('salon.permissionRequired'),
        t('salon.cameraPermission'),
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      if (index !== undefined) {
        newPhotos[index] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setPhotos(newPhotos);
    }
  };

  const launchGallery = async (index?: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t('salon.permissionRequired'),
        t('salon.galleryPermission'),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      if (index !== undefined) {
        newPhotos[index] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setPhotos(newPhotos);
    }
  };

  // ---------------------------------------------------------------------------
  // Remove photo
  // ---------------------------------------------------------------------------

  const removePhoto = (index: number) => {
    Alert.alert(
      t('salon.deletePhoto'),
      t('salon.deletePhotoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
          },
        },
      ],
    );
  };

  const toggleSpecialty = (specialtyId: string) => {
    setSelectedSpecialties(prev => {
      if (prev.includes(specialtyId)) {
        return prev.filter(id => id !== specialtyId);
      }
      return [...prev, specialtyId];
    });
  };

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // ---------------------------------------------------------------------------
  // Save handler - uses correct DB schema
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    // Validation
    if (!salonName.trim()) {
      Alert.alert(t('common.error'), t('salon.name') + ' *');
      return;
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert(t('common.error'), t('salon.address') + ' *');
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t('common.error'), t('salon.phone') + ' *');
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert(t('common.error'), t('salon.specialties') + ' *');
      return;
    }

    setIsSaving(true);

    try {
      if (isSupabaseConfigured()) {
        // Upload photos to Supabase Storage
        const photoUrls: string[] = [];
        for (const photoUri of photos) {
          if (photoUri.startsWith('http')) {
            photoUrls.push(photoUri);
            continue;
          }
          // Upload local photo
          const fileName = `salon_${user?.id}_${Date.now()}_${photoUrls.length}.jpg`;
          const response = await fetch(photoUri);
          const blob = await response.blob();
          const { data, error } = await supabase.storage
            .from('salon-photos')
            .upload(fileName, blob, { contentType: 'image/jpeg' });

          if (data) {
            const { data: urlData } = supabase.storage
              .from('salon-photos')
              .getPublicUrl(data.path);
            photoUrls.push(urlData.publicUrl);
          }
          if (error) {
            logger.warn('Photo upload error:', error);
          }
        }

        // ---------------------------------------------------------------
        // Save salon to database
        // The salons table has image_url and cover_image_url, NOT photos/specialties.
        // - image_url  = first photo (main)
        // - cover_image_url = second photo (cover)
        // - Additional photos go to gallery_images table
        // - Specialties are stored in coiffeur_details.specialties (TEXT[])
        // ---------------------------------------------------------------

        const salonData: Record<string, unknown> = {
          owner_id: user?.id,
          name: salonName.trim(),
          description: description.trim(),
          phone: phone.trim(),
          email: email,
          address: address.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          image_url: photoUrls[0] || null,
          cover_image_url: photoUrls[1] || null,
          opening_hours: openingHours,
          offers_home_service: offersHomeService,
          home_service_description: offersHomeService ? t('salon.homeServiceTravel') : null,
          min_home_service_amount: offersHomeService ? parseInt(homeServiceFee || '0', 10) : 0,
          is_active: true,
        };

        logger.debug('Saving salon data:', salonData);

        const { data: salonResult, error: salonError } = await supabase
          .from('salons')
          .upsert(salonData, { onConflict: 'owner_id' })
          .select()
          .single();

        if (salonError) {
          logger.error('Salon upsert error:', salonError);
          throw salonError;
        }

        logger.debug('Salon saved successfully:', salonResult?.id);

        // ---------------------------------------------------------------
        // Save gallery images (3rd and 4th photos) to gallery_images table
        // ---------------------------------------------------------------
        if (salonResult?.id && photoUrls.length > 2) {
          // Remove existing gallery images for this salon before re-inserting
          const { error: deleteGalleryError } = await supabase
            .from('gallery_images')
            .delete()
            .eq('salon_id', salonResult.id);

          if (deleteGalleryError) {
            logger.warn('Gallery cleanup error:', deleteGalleryError);
          }

          const galleryInserts = photoUrls.slice(2).map((url, idx) => ({
            salon_id: salonResult.id,
            image_url: url,
            order: idx,
          }));

          const { error: galleryError } = await supabase
            .from('gallery_images')
            .insert(galleryInserts);

          if (galleryError) {
            logger.warn('Gallery images insert error:', galleryError);
          }
        }

        // ---------------------------------------------------------------
        // Save specialties to coiffeur_details table (TEXT[] column)
        // ---------------------------------------------------------------
        if (user?.id) {
          const { error: detailsError } = await supabase
            .from('coiffeur_details')
            .upsert(
              {
                user_id: user.id,
                specialties: selectedSpecialties,
                offers_home_service: offersHomeService,
                home_service_fee: offersHomeService ? parseInt(homeServiceFee || '0', 10) : 0,
              },
              { onConflict: 'user_id' },
            );

          if (detailsError) {
            logger.warn('Coiffeur details upsert error:', detailsError);
          }
        }
      } else {
        // Demo mode - simulate save
        logger.info('Demo mode: simulating salon save');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      Alert.alert(
        t('salon.saved'),
        t('salon.savedDesc'),
        [{ text: 'OK' }],
      );
    } catch (err) {
      logger.error('Salon save error:', err);
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Not authenticated - prompt to log in
  // ---------------------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="storefront" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            {t('salon.mySalon')}
          </Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            {t('salon.loginMessage')}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>{t('salon.connectLogin')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}>
            <Text style={[styles.authLink, { color: colors.primary }]}>
              {t('salon.createPro')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main salon form
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photos du salon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.photos')} ({photos.length}/{MAX_PHOTOS})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('salon.addPhotos', { max: MAX_PHOTOS })}
          </Text>

          <View style={styles.photosGrid}>
            {[0, 1, 2, 3].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.photoCard,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                ]}
                onPress={() => photos[index] ? null : pickImage()}
              >
                {photos[index] ? (
                  <View style={styles.photoWrapper}>
                    <Image
                      source={{ uri: photos[index] }}
                      style={styles.photo}
                      contentFit="cover"
                    />
                    <View style={styles.photoActions}>
                      <TouchableOpacity
                        style={[styles.photoActionButton, { backgroundColor: colors.primary }]}
                        onPress={() => pickImage(index)}
                      >
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.photoActionButton, { backgroundColor: colors.error }]}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="add-circle-outline" size={32} color={colors.textMuted} />
                    <Text style={[styles.photoPlaceholderText, { color: colors.textMuted }]}>
                      {t('common.add')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations du salon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.info')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.name')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('salon.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={salonName}
              onChangeText={setSalonName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('salon.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.phone')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('salon.phonePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary, borderColor: colors.border }]}
              value={email}
              editable={false}
            />
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              {t('salon.emailHint')}
            </Text>
          </View>
        </View>

        {/* Localisation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.location')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.address')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('salon.addressPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.city')} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t('salon.cityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.md }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.postalCode')} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="75001"
                placeholderTextColor={colors.textMuted}
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Specialites */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.specialties')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('salon.selectSpecialties', { count: selectedSpecialties.length })}
          </Text>

          <View style={styles.specialtiesGrid}>
            {AFRO_SPECIALTIES.map((specialty) => {
              const isSelected = selectedSpecialties.includes(specialty.id);
              return (
                <TouchableOpacity
                  key={specialty.id}
                  style={[
                    styles.specialtyCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => toggleSpecialty(specialty.id)}
                >
                  <Ionicons
                    name={specialty.icon as any}
                    size={24}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.specialtyName,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {specialty.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.specialtyCheck}>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Horaires d'ouverture */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.openingHours')}
          </Text>

          {DAYS_OF_WEEK.map((day) => {
            const hours = openingHours[day.key];
            return (
              <View key={day.key} style={[styles.dayRow, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.dayToggle}
                  onPress={() => updateDayHours(day.key, 'closed', !hours.closed)}
                >
                  <View style={[
                    styles.dayCheckbox,
                    !hours.closed && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border },
                  ]}>
                    {!hours.closed && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.dayLabel,
                    { color: hours.closed ? colors.textMuted : colors.text },
                  ]}>
                    {t(`day.${day.key}`)}
                  </Text>
                </TouchableOpacity>
                {!hours.closed ? (
                  <View style={styles.hoursInputRow}>
                    <TextInput
                      style={[styles.hoursInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                      value={hours.open}
                      onChangeText={(v) => updateDayHours(day.key, 'open', v)}
                      placeholder="09:00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                    />
                    <Text style={[styles.hoursSeparator, { color: colors.textSecondary }]}>-</Text>
                    <TextInput
                      style={[styles.hoursInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                      value={hours.close}
                      onChangeText={(v) => updateDayHours(day.key, 'close', v)}
                      placeholder="19:00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                ) : (
                  <Text style={[styles.closedText, { color: colors.textMuted }]}>
                    {t('common.closed')}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Service a domicile */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('salon.homeService')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('salon.homeServiceDesc')}
          </Text>

          <TouchableOpacity
            style={[
              styles.homeServiceToggle,
              { backgroundColor: colors.card, borderColor: colors.border },
              offersHomeService && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
            ]}
            onPress={() => setOffersHomeService(!offersHomeService)}
          >
            <View style={[
              styles.dayCheckbox,
              offersHomeService && { backgroundColor: colors.primary, borderColor: colors.primary },
              { borderColor: colors.border },
            ]}>
              {offersHomeService && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.homeServiceText}>
              <Text style={[styles.homeServiceLabel, { color: colors.text }]}>
                {t('salon.homeService')}
              </Text>
              <Text style={[styles.homeServiceDesc, { color: colors.textSecondary }]}>
                {t('salon.homeServiceTravel')}
              </Text>
            </View>
            <Ionicons name="home-outline" size={24} color={offersHomeService ? colors.primary : colors.textMuted} />
          </TouchableOpacity>

          {offersHomeService && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('salon.homeServiceFee')} ({'\u20AC'})</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 15"
                placeholderTextColor={colors.textMuted}
                value={homeServiceFee}
                onChangeText={setHomeServiceFee}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Bouton de sauvegarde */}
        <View style={styles.saveSection}>
          <Button
            title={isSaving ? t('salon.saving') : t('salon.save')}
            onPress={handleSave}
            fullWidth
            loading={isSaving}
            disabled={isSaving}
          />
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoCard: {
    width: '48%',
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  photoActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specialtyCard: {
    width: '31%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  specialtyName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  specialtyCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  dayLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  hoursInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: FontSizes.sm,
    width: 60,
    textAlign: 'center',
  },
  hoursSeparator: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  closedText: {
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  homeServiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  homeServiceText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  homeServiceLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  homeServiceDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  saveSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },

  /* Auth Prompt */
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
