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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';

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
  const { user, isAuthenticated } = useAuth();

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

  // Email par defaut (celui de l'inscription)
  const email = user?.email || '';

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
      // Simuler la sauvegarde (a remplacer par l'appel API reel)
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Salon enregistre!',
        'Les informations de votre salon ont ete sauvegardees avec succes.',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
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

        {/* Bouton de sauvegarde */}
        <View style={styles.saveSection}>
          <Button
            title={isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
