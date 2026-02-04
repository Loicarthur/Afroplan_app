/**
 * Page de gestion du salon - Espace Coiffeur AfroPlan
 * Integre les APIs pour la creation/modification du salon et service a domicile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService, coiffeurService } from '@/services';
import { Salon, CoiffeurDetails } from '@/types';

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

export default function SalonManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingSalon, setExistingSalon] = useState<Salon | null>(null);
  const [coiffeurDetails, setCoiffeurDetails] = useState<CoiffeurDetails | null>(null);

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

  // Service a domicile
  const [offersHomeService, setOffersHomeService] = useState(false);
  const [homeServiceFee, setHomeServiceFee] = useState('0');
  const [homeServiceDescription, setHomeServiceDescription] = useState('');
  const [maxHomeServiceDistance, setMaxHomeServiceDistance] = useState('20');
  const [minHomeServiceAmount, setMinHomeServiceAmount] = useState('30');

  // Informations professionnelles
  const [bio, setBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('0');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Email par defaut (celui de l'inscription)
  const email = user?.email || '';

  // Charger les donnees existantes
  useEffect(() => {
    loadExistingData();
  }, [user]);

  const loadExistingData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Charger le salon existant
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        setExistingSalon(salon);
        setSalonName(salon.name);
        setDescription(salon.description || '');
        setPhone(salon.phone || '');
        setAddress(salon.address);
        setCity(salon.city);
        setPostalCode(salon.postal_code);
        setOffersHomeService(salon.offers_home_service || false);
        setHomeServiceDescription((salon as any).home_service_description || '');
        setMinHomeServiceAmount(String((salon as any).min_home_service_amount || 30));
      }

      // Charger les details du coiffeur
      const details = await coiffeurService.getCoiffeurDetails(user.id);
      if (details) {
        setCoiffeurDetails(details);
        setBio(details.bio || '');
        setYearsOfExperience(String(details.years_of_experience));
        setSelectedSpecialties(details.specialties || []);
        setHomeServiceFee(String(details.home_service_fee));
        setMaxHomeServiceDistance(String(details.max_home_service_distance));
        setInstagramUrl(details.instagram_url || '');
        setOffersHomeService(details.offers_home_service);
      }
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (index?: number) => {
    if (photos.length >= MAX_PHOTOS && index === undefined) {
      Alert.alert('Limite atteinte', `Vous ne pouvez ajouter que ${MAX_PHOTOS} photos maximum.`);
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'acces a la galerie pour ajouter des photos.');
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

  const handleSave = async () => {
    // Validation
    if (!salonName.trim()) {
      Alert.alert('Erreur', 'Le nom du salon est obligatoire');
      return;
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Erreur', 'L\'adresse complete est obligatoire');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Le numero de telephone est obligatoire');
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert('Erreur', 'Veuillez selectionner au moins une specialite');
      return;
    }

    setIsSaving(true);

    try {
      // Sauvegarder ou mettre a jour le salon
      const salonData = {
        name: salonName.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email,
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        country: 'France',
        offers_home_service: offersHomeService,
        home_service_description: homeServiceDescription.trim(),
        min_home_service_amount: parseFloat(minHomeServiceAmount) || 30,
      };

      let savedSalon: Salon;
      if (existingSalon) {
        savedSalon = await salonService.updateSalon(existingSalon.id, salonData);
      } else {
        savedSalon = await salonService.createSalon({
          ...salonData,
          owner_id: user!.id,
        });
      }

      // Sauvegarder les details du coiffeur
      await coiffeurService.upsertCoiffeurDetails({
        user_id: user!.id,
        bio: bio.trim(),
        years_of_experience: parseInt(yearsOfExperience) || 0,
        specialties: selectedSpecialties,
        offers_home_service: offersHomeService,
        offers_salon_service: true,
        home_service_fee: parseFloat(homeServiceFee) || 0,
        max_home_service_distance: parseInt(maxHomeServiceDistance) || 20,
        instagram_url: instagramUrl.trim() || null,
        is_available: true,
        vacation_mode: false,
        min_home_service_distance: 0,
        vacation_start: null,
        vacation_end: null,
        facebook_url: null,
        tiktok_url: null,
        portfolio_url: null,
        certifications: null,
        is_identity_verified: false,
        is_address_verified: false,
        has_insurance: false,
        insurance_number: null,
      });

      setExistingSalon(savedSalon);

      Alert.alert(
        'Salon enregistre!',
        existingSalon
          ? 'Les modifications ont ete sauvegardees avec succes.'
          : 'Votre salon est maintenant visible par les clients!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Statut du salon */}
        {existingSalon && (
          <View style={[styles.statusBanner, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Votre salon est visible par les clients
            </Text>
          </View>
        )}

        {/* Photos du salon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Photos du salon ({photos.length}/{MAX_PHOTOS})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Ajoutez jusqu'a {MAX_PHOTOS} photos de votre salon
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
              L'email est celui de votre compte et ne peut pas etre modifie
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

        {/* Profil professionnel */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Profil professionnel
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Biographie</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Parlez de votre parcours, vos formations..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Annees d'experience</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="5"
                placeholderTextColor={colors.textMuted}
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 2, marginLeft: Spacing.md }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Instagram</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="@votre_profil"
                placeholderTextColor={colors.textMuted}
                value={instagramUrl}
                onChangeText={setInstagramUrl}
              />
            </View>
          </View>
        </View>

        {/* Service a domicile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Service a domicile
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Proposez vos services directement chez vos clients
              </Text>
            </View>
            <Switch
              value={offersHomeService}
              onValueChange={setOffersHomeService}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {offersHomeService && (
            <View style={[styles.homeServiceOptions, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Frais de deplacement (EUR)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  value={homeServiceFee}
                  onChangeText={setHomeServiceFee}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Distance max de deplacement (km)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="20"
                  placeholderTextColor={colors.textMuted}
                  value={maxHomeServiceDistance}
                  onChangeText={setMaxHomeServiceDistance}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Montant minimum de prestation (EUR)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  value={minHomeServiceAmount}
                  onChangeText={setMinHomeServiceAmount}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                  Montant minimum pour vous deplacer
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description du service</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Je me deplace avec tout mon materiel..."
                  placeholderTextColor={colors.textMuted}
                  value={homeServiceDescription}
                  onChangeText={setHomeServiceDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.zoneButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => router.push('/(coiffeur)/zones' as any)}
              >
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <Text style={[styles.zoneButtonText, { color: colors.primary }]}>
                  Gerer mes zones de couverture
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
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

        {/* Actions supplementaires */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(coiffeur)/promotions' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="pricetag-outline" size={24} color={colors.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Gerer mes promotions
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Creez des offres pour attirer plus de clients
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(coiffeur)/services' as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="cut-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Gerer mes services
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Ajoutez et modifiez vos prestations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Bouton de sauvegarde */}
        <View style={styles.saveSection}>
          <Button
            title={isSaving ? 'Enregistrement...' : (existingSalon ? 'Mettre a jour' : 'Creer mon salon')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
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
  homeServiceOptions: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  zoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  zoneButtonText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  saveSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
});
