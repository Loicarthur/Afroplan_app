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

// Liste des spécialités synchronisée avec les catégories globales de l'app
const AFRO_SPECIALTIES = HAIRSTYLE_CATEGORIES.map(cat => ({
  id: cat.id,
  name: cat.title,
  icon: cat.emoji, // On peut utiliser l'emoji comme icône ou mapper vers Ionicons
}));

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
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  // Aperçu des services configurés (affiché dans la section salon)
  const [servicesSummary, setServicesSummary] = useState<{ name: string; price: number }[]>([]);

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
  const [videos, setVideos] = useState<string[]>([]);

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
          
          // Répartir les photos avec repli intelligent
          const initialCover = salon.cover_image_url || salon.image_url || (salon.photos && salon.photos.length > 0 ? salon.photos[0] : null);
          if (initialCover) {
            setCoverPhoto(initialCover);
          }
          
          if (salon.photos && salon.photos.length > 0) {
            // Si la première photo du tableau est la cover, on l'ignore pour la galerie ambiance
            const galleryStartIdx = (salon.photos[0] === initialCover) ? 1 : 0;
            setGalleryPhotos(salon.photos.slice(galleryStartIdx, galleryStartIdx + 2));
          }
          
          // Déduire le type de localisation depuis les données existantes
          if (salon.offers_home_service) {
            setServiceLocationType('both');
          } else {
            setServiceLocationType('salon');
          }
          if (salon.opening_hours) {
            setOpeningHours(salon.opening_hours as unknown as OpeningHours);
          }

          // Charger les services configurés (résumé + compteur)
          try {
            const services = await salonService.getSalonServices(salon.id);
            const count = services?.length || 0;
            setServicesCount(count);
            setServicesSummary(
              (services || []).slice(0, 3).map((s) => ({ name: s.name, price: s.price }))
            );
          } catch (e) {
            setServicesCount(0);
          }
        }
      } catch {
        // Pas de salon existant
      }
    };
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
        'Mode Démo',
        'Supabase n\'est pas configuré. Les données ne seront pas sauvegardées sur le serveur.'
      );
      setIsSaving(false);
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), 'Vous devez être connecté pour créer un salon.');
      return;
    }

    setIsSaving(true);

    try {
      // Helper pour upload ultra-stable (Base64 -> ArrayBuffer)
      const uploadFile = async (uri: string, prefix: string) => {
        if (uri.startsWith('http')) return uri;
        
        try {
          const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${user?.id}/${prefix}_${Date.now()}.${extension}`;
          const contentType = prefix === 'video' ? 'video/mp4' : `image/${extension === 'png' ? 'png' : 'jpeg'}`;

          // 1. Lire le fichier en Base64 via XHR (le plus compatible)
          const base64: string = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              const reader = new FileReader();
              reader.onloadend = function () {
                const result = reader.result as string;
                // Extraire uniquement la partie data
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => reject(new Error('Erreur lecture fichier local'));
            xhr.open('GET', uri);
            xhr.responseType = 'blob';
            xhr.send();
          });

          // 2. Décoder le base64 en ArrayBuffer (données binaires pures)
          const arrayBuffer = base64js.toByteArray(base64);

          // 3. Envoyer à Supabase
          const { data, error } = await supabase.storage
            .from('salon-photos')
            .upload(fileName, arrayBuffer, {
              contentType,
              upsert: true
            });

          if (error) throw error;
          
          const { data: urlData } = supabase.storage.from('salon-photos').getPublicUrl(data.path);
          return urlData.publicUrl;
        } catch (err: any) {
          console.error('Stable Upload Error:', err);
          throw new Error(`Upload échoué: ${err.message || 'Problème réseau'}`);
        }
      };

      // 1. Upload Cover
      let finalCoverUrl = null;
      if (coverPhoto) {
        finalCoverUrl = await uploadFile(coverPhoto, 'cover');
      }

      // 2. Upload Gallery
      const finalGalleryUrls = [];
      for (const uri of galleryPhotos) {
        const url = await uploadFile(uri, 'gallery');
        finalGalleryUrls.push(url);
      }

      // Préparer le tableau photos final (Cover + Gallery)
      const allPhotos = finalCoverUrl ? [finalCoverUrl, ...finalGalleryUrls] : finalGalleryUrls;

      // 3. Upload Videos (simple mapping for now as storage bucket might need config)
      const finalVideoUrls = [];
      for (const uri of videos) {
        // En prod, on uploaderait dans un bucket 'salon-videos'
        const url = await uploadFile(uri, 'video'); 
        finalVideoUrls.push(url);
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
        cover_image_url: finalCoverUrl,
        image_url: finalCoverUrl, 
        photos: allPhotos,
        // On pourrait stocker les vidéos dans une colonne 'videos' si on l'ajoute plus tard
        opening_hours: openingHours,
        offers_home_service: serviceLocationType === 'domicile' || serviceLocationType === 'both' || serviceLocationType === 'coiffeur_home',
        service_location: serviceLocationType,
        min_home_service_amount: (serviceLocationType === 'domicile' || serviceLocationType === 'both')
          ? parseFloat(homeServiceFee || '0')
          : 0,
        is_active: isPublished,
      };

      const isNewSalon = !existingSalonId;

      if (existingSalonId) {
        await salonService.updateSalon(existingSalonId, salonPayload as any);
      } else {
        const newSalon = await salonService.createSalon({
          ...salonPayload,
          owner_id: user.id,
        } as any);
        setExistingSalonId(newSalon.id);
      }

      if (isNewSalon) {
        // Flux d'onboarding : après la création du salon, aller directement configurer les services
        Alert.alert(
          '✓ Salon créé !',
          'Super ! Maintenant ajoutez vos prestations et tarifs pour que les clients puissent réserver.',
          [
            {
              text: 'Ajouter mes prestations →',
              onPress: () => router.push({ pathname: '/(coiffeur)/services', params: { from: 'salon' } }),
            },
          ]
        );
      } else {
        // Mise à jour d'un salon existant
        Alert.alert('Salon mis à jour', 'Vos modifications ont été enregistrées.');
      }
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
      // 1. Vérifier si des services sont configurés
      if (existingSalonId) {
        const services = await salonService.getSalonServices(existingSalonId);
        if (!services || services.length === 0) {
          Alert.alert(
            'Services manquants',
            'Vous devez configurer au moins un service (prix/durée) avant de publier votre salon.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Gérer mes services', onPress: () => router.push('/(coiffeur)/services') }
            ]
          );
          setIsPublishing(false);
          return;
        }
      }

      // 2. Sauvegarder d'abord, puis publier
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
        {/* Section Médias du salon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Photo de face professionnelle</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Cette photo sera l&apos;image principale de votre salon. Elle doit être de haute qualité pour attirer les clients.
          </Text>

          {/* Photo de Couverture (Unique et Professionnelle) */}
          <TouchableOpacity
            style={[styles.coverPhotoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, height: 220 }]}
            onPress={() => pickMedia('cover')}
          >
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
                <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: '600' }}>Ajouter la photo de face</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Format paysage recommandé</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Conseil : Les photos de vos styles de coiffure doivent être ajoutées dans la rubrique &quot;Services&quot; pour être visibles par les clients.
            </Text>
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
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TouchableOpacity 
                onPress={() => setDescription("Bienvenue dans notre salon, où l’art de la coiffure afro rencontre l’excellence. Spécialistes des tresses de précision, des locks sculpturales et des soins profonds, nous mettons notre savoir-faire au service de votre couronne naturelle. Dans un cadre raffiné et chaleureux, chaque prestation est une expérience unique pensée pour sublimer votre beauté et préserver la santé de vos cheveux. Venez révéler tout l'éclat de votre style avec nos experts.")}
              >
                <Text style={[styles.templateLink, { color: colors.primary }]}>Utiliser un modèle</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Décrivez votre savoir-faire, l'ambiance de votre salon..."
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
              // Détection robuste d'emoji (Unicode)
              const isEmoji = specialty.icon && /\p{Emoji}/u.test(specialty.icon);

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
                  {isEmoji ? (
                    <Text style={{ fontSize: 24 }}>{specialty.icon}</Text>
                  ) : (
                    <Ionicons
                      name={specialty.icon as any}
                      size={24}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                  )}
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
            Type d&apos;établissement
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Où recevez-vous vos clients ?
          </Text>

          {(
            [
              {
                value: 'salon' as const,
                label: 'Salon professionnel',
                desc: 'Local commercial avec vitrine',
                icon: 'storefront-outline',
              },
              {
                value: 'coiffeur_home' as const,
                label: 'À mon domicile',
                desc: 'Je reçois chez moi (adresse privée)',
                icon: 'home-outline',
              },
              {
                value: 'domicile' as const,
                label: 'Chez le client uniquement',
                desc: 'Je me déplace uniquement',
                icon: 'car-outline',
              },
              {
                value: 'both' as const,
                label: 'Mixte',
                desc: 'Je reçois et je me déplace',
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
                Frais de déplacement (€)
              </Text>
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

        {/* ── MES PRESTATIONS — Section intégrée au salon ── */}
        <View style={styles.section}>
          <View style={styles.servicesSectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mes Prestations</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {servicesCount === null
                  ? 'Chargement...'
                  : servicesCount === 0
                  ? 'Aucune prestation configurée — requis pour publier'
                  : `${servicesCount} prestation${servicesCount > 1 ? 's' : ''} configurée${servicesCount > 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.manageServicesBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(coiffeur)/services')}
            >
              <Ionicons name={servicesCount === 0 ? 'add' : 'pencil'} size={16} color="#FFF" />
              <Text style={styles.manageServicesBtnText}>
                {servicesCount === 0 ? 'Ajouter' : 'Gérer'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Aperçu des 3 premières prestations */}
          {servicesSummary.length > 0 ? (
            <View style={[styles.servicesPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {servicesSummary.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.servicePreviewRow,
                    i < servicesSummary.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.servicePreviewDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.servicePreviewName, { color: colors.text }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={[styles.servicePreviewPrice, { color: colors.primary }]}>
                    {s.price} €
                  </Text>
                </View>
              ))}
              {(servicesCount ?? 0) > 3 && (
                <TouchableOpacity
                  style={styles.servicePreviewMore}
                  onPress={() => router.push('/(coiffeur)/services')}
                >
                  <Text style={[styles.servicePreviewMoreText, { color: colors.primary }]}>
                    + {(servicesCount ?? 0) - 3} autre{(servicesCount ?? 0) - 3 > 1 ? 's' : ''} prestation{(servicesCount ?? 0) - 3 > 1 ? 's' : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* CTA si aucun service */
            <TouchableOpacity
              style={[styles.noServiceCTA, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => router.push('/(coiffeur)/services')}
            >
              <Ionicons name="cut-outline" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noServiceCTATitle, { color: colors.text }]}>
                  Configurez vos tarifs
                </Text>
                <Text style={[styles.noServiceCTADesc, { color: colors.textSecondary }]}>
                  Ajoutez vos prestations (tresses, locks, soins...) avec prix et durée. Obligatoire pour être réservé.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
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
              style={[
                styles.publishButton, 
                (isPublishing || servicesCount === 0) && styles.publishButtonDisabled,
                servicesCount === 0 && { backgroundColor: '#4B5563' }
              ]}
              onPress={handlePublish}
              disabled={isPublishing || isSaving || servicesCount === 0}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={servicesCount === 0 ? "lock-closed-outline" : "rocket-outline"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.publishButtonText}>
                {servicesCount === 0 
                  ? 'Services requis' 
                  : isPublishing
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
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  coverPhotoCard: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 12,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  templateLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
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
  /* Section Services intégrée */
  servicesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  manageServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  manageServicesBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  servicesPreview: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  servicePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  servicePreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  servicePreviewName: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  servicePreviewPrice: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  servicePreviewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  servicePreviewMoreText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  noServiceCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  noServiceCTATitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  noServiceCTADesc: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
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
