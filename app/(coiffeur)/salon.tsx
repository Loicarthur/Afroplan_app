/**
 * Page de gestion du salon - Espace Coiffeur AfroPlan
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

type SalonLocationType = 'salon' | 'domicile' | 'both';

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
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [existingSalonId, setExistingSalonId] = useState<string | null>(null);

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

  // Lieu de prestation du salon
  const [serviceLocationType, setServiceLocationType] = useState<SalonLocationType>('salon');
  const [homeServiceFee, setHomeServiceFee] = useState('');

  // Email par defaut (celui de l'inscription)
  const email = user?.email || '';

  // Charger le salon existant si disponible
  React.useEffect(() => {
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
          // Déduire le type de localisation depuis les données existantes
          if (salon.offers_home_service) {
            setServiceLocationType('both');
          } else {
            setServiceLocationType('salon');
          }
          if (salon.opening_hours) {
            setOpeningHours(salon.opening_hours as unknown as OpeningHours);
          }
        }
      } catch {
        // Pas de salon existant
      }
    };
    loadExistingSalon();
  }, [user?.id]);

  const pickImage = async (index?: number) => {
    if (photos.length >= MAX_PHOTOS && index === undefined) {
      Alert.alert(t('common.error'), `Vous ne pouvez ajouter que ${MAX_PHOTOS} photos maximum.`);
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Info', 'La sélection d\'image n\'est pas encore supportée sur le web dans cette démo.');
      return;
    }

    try {
      Alert.alert(
        'Ajouter une photo',
        'Choisissez la source',
        [
          {
            text: 'Prendre une photo',
            onPress: async () => {
              try {
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                if (!cameraPermission.granted) {
                  Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra pour prendre des photos.');
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
              } catch (e) {
                console.error(e);
                Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra.');
              }
            },
          },
          {
            text: 'Choisir depuis la galerie',
            onPress: async () => {
              try {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                  Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour ajouter des photos.');
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
              } catch (e) {
                console.error(e);
                Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie.');
              }
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    } catch (e) {
      console.error(e);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Supprimer la photo',
      'Voulez-vous vraiment supprimer cette photo?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
          },
        },
      ]
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

  const handleSave = async () => {
    // Validation
    if (!salonName.trim()) {
      Alert.alert(t('common.error'), 'Le nom du salon est requis');
      return;
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert(t('common.error'), 'L\'adresse complete est requise');
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t('common.error'), 'Le telephone est requis');
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert(t('common.error'), 'Selectionnez au moins une specialite');
      return;
    }

    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Configuration requise',
        'La connexion au serveur n\'est pas configuree. Verifiez votre fichier .env.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), 'Vous devez etre connecte pour creer un salon.');
      return;
    }

    setIsSaving(true);

    try {
      // Upload photos to Supabase Storage
      const photoUrls: string[] = [];
      for (const photoUri of photos) {
        if (photoUri.startsWith('http')) {
          photoUrls.push(photoUri);
          continue;
        }
        const fileName = `salon_${user.id}_${Date.now()}_${photoUrls.length}.jpg`;
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
        if (error && __DEV__) console.warn('Photo upload error:', error);
      }

      const salonPayload = {
        name: salonName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email,
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        specialties: selectedSpecialties,
        cover_image_url: photoUrls.length > 0 ? photoUrls[0] : null,
        photos: photoUrls,
        opening_hours: openingHours,
        offers_home_service: serviceLocationType === 'domicile' || serviceLocationType === 'both',
        min_home_service_amount: (serviceLocationType === 'domicile' || serviceLocationType === 'both')
          ? parseFloat(homeServiceFee || '0')
          : 0,
        is_active: isPublished,
      };

      if (existingSalonId) {
        await salonService.updateSalon(existingSalonId, salonPayload as any);
      } else {
        const newSalon = await salonService.createSalon({
          ...salonPayload,
          owner_id: user.id,
        } as any);
        setExistingSalonId(newSalon.id);
      }

      Alert.alert(
        t('salon.saved'),
        t('salon.savedDesc'),
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const errorMessage = err?.message || t('common.errorOccurred');
      Alert.alert(t('common.error'), errorMessage);
      if (__DEV__) console.warn('Salon save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // Validation complète avant publication
    if (!salonName.trim() || !address.trim() || !city.trim() || !postalCode.trim() || !phone.trim()) {
      Alert.alert(
        t('common.error'),
        language === 'en'
          ? 'Please fill in all required fields before publishing.'
          : 'Veuillez remplir tous les champs obligatoires avant de publier.'
      );
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert(
        t('common.error'),
        language === 'en'
          ? 'Select at least one specialty before publishing.'
          : 'Sélectionnez au moins une spécialité avant de publier.'
      );
      return;
    }

    setIsPublishing(true);
    try {
      // Sauvegarder d'abord, puis publier
      await handleSave();

      if (existingSalonId) {
        await salonService.updateSalon(existingSalonId, { is_active: true } as any);
      }

      setIsPublished(true);
      Alert.alert(
        language === 'en' ? 'Salon Published!' : 'Salon publié !',
        language === 'en'
          ? 'Your salon is now visible to clients. They can find you using search and filters.'
          : 'Votre salon est maintenant visible par les clients. Ils peuvent vous trouver via la recherche et les filtres.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const errorMessage = err?.message || t('common.errorOccurred');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  // Si pas connecté → écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="storefront" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon salon</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour créer et gérer votre salon, ajouter vos photos et spécialités
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photos du salon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Photos du salon ({photos.length}/{MAX_PHOTOS})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Ajoutez jusqu&apos;a {MAX_PHOTOS} photos de votre salon
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
                      Ajouter
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
            Informations du salon
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom du salon *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: Afro Beauty Paris"
              placeholderTextColor={colors.textMuted}
              value={salonName}
              onChangeText={setSalonName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Decrivez votre salon, vos specialites..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Telephone *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: +33 6 12 34 56 78"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary, borderColor: colors.border }]}
              value={email}
              editable={false}
            />
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              L&apos;email est celui de votre compte et ne peut pas etre modifie
            </Text>
          </View>
        </View>

        {/* Localisation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Localisation
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: 123 Rue de la Paix"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Ville *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Paris"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.md }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Code postal *</Text>
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
            Specialites de coiffure afro
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Selectionnez vos specialites ({selectedSpecialties.length} selectionnees)
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
                    {language === 'en' ? day.labelEn : day.label}
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
                    {language === 'en' ? 'Closed' : 'Fermé'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Lieu de prestation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Lieu de prestation
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Où réalisez-vous vos prestations ?
          </Text>

          {(
            [
              {
                value: 'salon' as const,
                label: 'En salon uniquement',
                desc: 'Les clients viennent dans votre salon',
                icon: 'storefront-outline',
              },
              {
                value: 'domicile' as const,
                label: 'À domicile uniquement',
                desc: 'Vous vous déplacez chez les clients',
                icon: 'home-outline',
              },
              {
                value: 'both' as const,
                label: 'Salon & Domicile',
                desc: 'En salon ou à domicile selon le client',
                icon: 'swap-horizontal-outline',
              },
            ]
          ).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.locationTypeCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                serviceLocationType === opt.value && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '10',
                },
              ]}
              onPress={() => setServiceLocationType(opt.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon as any}
                size={26}
                color={serviceLocationType === opt.value ? colors.primary : colors.textSecondary}
              />
              <View style={styles.locationTypeText}>
                <Text style={[
                  styles.locationTypeLabel,
                  { color: serviceLocationType === opt.value ? colors.primary : colors.text },
                ]}>
                  {opt.label}
                </Text>
                <Text style={[styles.locationTypeDesc, { color: colors.textSecondary }]}>
                  {opt.desc}
                </Text>
              </View>
              {serviceLocationType === opt.value && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          {(serviceLocationType === 'domicile' || serviceLocationType === 'both') && (
            <View style={[styles.inputGroup, { marginTop: Spacing.md }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('salon.homeServiceFee')} (€)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 15"
                placeholderTextColor={colors.textMuted}
                value={homeServiceFee}
                onChangeText={setHomeServiceFee}
                keyboardType="numeric"
              />
              <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                Frais de déplacement facturés en supplément
              </Text>
            </View>
          )}
        </View>

        {/* Statut de publication */}
        {isPublished && (
          <View style={[styles.publishedBanner, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            <View style={styles.publishedBannerContent}>
              <Text style={styles.publishedBannerTitle}>
                {language === 'en' ? 'Salon Published' : 'Salon publié'}
              </Text>
              <Text style={styles.publishedBannerDesc}>
                {language === 'en'
                  ? 'Your salon is visible to clients'
                  : 'Votre salon est visible par les clients'}
              </Text>
            </View>
          </View>
        )}

        {/* Boutons de sauvegarde et publication */}
        <View style={styles.saveSection}>
          <Button
            title={isSaving ? t('salon.saving') : t('salon.save')}
            onPress={handleSave}
            fullWidth
            loading={isSaving}
            disabled={isSaving || isPublishing}
          />

          {!isPublished && (
            <TouchableOpacity
              style={[styles.publishButton, (isPublishing) && styles.publishButtonDisabled]}
              onPress={handlePublish}
              disabled={isPublishing || isSaving}
              activeOpacity={0.8}
            >
              <Ionicons name="rocket-outline" size={20} color="#FFFFFF" />
              <Text style={styles.publishButtonText}>
                {isPublishing
                  ? (language === 'en' ? 'Publishing...' : 'Publication...')
                  : (language === 'en' ? 'Publish my salon' : 'Publier mon salon')}
              </Text>
            </TouchableOpacity>
          )}
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
  locationTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
  },
  locationTypeText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  locationTypeLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  locationTypeDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  publishedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  publishedBannerContent: {
    flex: 1,
  },
  publishedBannerTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#166534',
  },
  publishedBannerDesc: {
    fontSize: FontSizes.sm,
    color: '#15803D',
    marginTop: 2,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  publishButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '700',
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
