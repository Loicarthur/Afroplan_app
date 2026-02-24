/**
 * Page Ma Vitrine - Espace Coiffeur AfroPlan
 * Fusion de la gestion du Salon et des Prestations (Services)
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
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
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
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService } from '@/services/salon.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { HAIRSTYLE_CATEGORIES, findStyleById } from '@/constants/hairstyleCategories';

// ─── TYPES & CONSTANTES ──────────────────────────────────────────────────────

type SalonLocationType = 'salon' | 'coiffeur_home' | 'domicile' | 'both';
type ServiceLocation = 'salon' | 'domicile' | 'both';

const AFRO_SPECIALTIES = HAIRSTYLE_CATEGORIES.map(cat => ({
  id: cat.id,
  name: cat.title,
  icon: cat.emoji,
}));

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

interface DayHours { open: string; close: string; closed: boolean; }
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
  customImage?: string;
  customDescription?: string;
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function MaVitrineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<'info' | 'prestations'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [existingSalonId, setExistingSalonId] = useState<string | null>(null);

  // ─── ÉTATS SALON (INFO) ───────────────────
  const [salonName, setSalonName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [serviceLocationType, setServiceLocationType] = useState<SalonLocationType>('salon');
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState('20');

  // ─── ÉTATS PRESTATIONS (SERVICES) ──────────
  const [configuredStyles, setConfiguredStyles] = useState<ConfiguredStyle[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [isBatchConfiguring, setIsBatchConfiguring] = useState(false);
  const [batchData, setBatchData] = useState<Record<string, Partial<ConfiguredStyle>>>({});

  // ─── CHARGEMENT DES DONNÉES ───────────────
  const loadData = async () => {
    if (!user?.id) return;
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
        setCoverPhoto(salon.cover_image_url || salon.image_url);
        if (salon.opening_hours) setOpeningHours(salon.opening_hours as any);
        setServiceLocationType(salon.service_location as SalonLocationType || 'salon');
        
        // Charger les services
        const services = await salonService.getSalonServices(salon.id);
        const mapped: ConfiguredStyle[] = services.map(s => ({
          styleId: s.id,
          styleName: s.name,
          categoryLabel: s.category,
          price: s.price.toString(),
          duration: s.duration_minutes.toString(),
          location: s.service_location as ServiceLocation,
          requiresExtensions: s.requires_extensions,
          extensionsIncluded: s.extensions_included,
          customImage: s.image_url || undefined,
          customDescription: s.description || '',
        }));
        setConfiguredStyles(mapped);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  // ─── ACTIONS SALON ────────────────────────
  const handleSaveSalon = async () => {
    if (!salonName.trim() || !address.trim() || !city.trim() || !phone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (*)');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: salonName, description, phone, address, city, postal_code: postalCode,
        opening_hours: openingHours, service_location: serviceLocationType,
        cover_image_url: coverPhoto, owner_id: user?.id
      };
      if (existingSalonId) await salonService.updateSalon(existingSalonId, payload as any);
      else await salonService.createSalon(payload as any);
      Alert.alert('Succès', 'Informations de la vitrine enregistrées.');
      loadData();
    } catch (e) { Alert.alert('Erreur', 'Impossible de sauvegarder.'); }
    finally { setIsSaving(false); }
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    if (!result.canceled) setCoverPhoto(result.assets[0].uri);
  };

  // ─── ACTIONS PRESTATIONS ──────────────────
  const toggleStyleSelection = (id: string) => {
    setSelectedStyleIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const startBatch = () => {
    const initialData: Record<string, Partial<ConfiguredStyle>> = {};
    selectedStyleIds.forEach(id => {
      const existing = configuredStyles.find(s => s.styleId === id);
      if (existing) initialData[id] = { ...existing };
      else {
        const entry = HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).find(s => s.id === id);
        initialData[id] = { styleId: id, styleName: entry?.name, location: 'salon', price: '', duration: '' };
      }
    });
    setBatchData(initialData);
    setIsBatchConfiguring(true);
  };

  const saveBatch = async () => {
    if (!existingSalonId) { Alert.alert('Erreur', 'Créez d\'abord votre salon.'); return; }
    setIsSaving(true);
    try {
      const stylesToSave = selectedStyleIds.map(id => batchData[id]);
      const payload = stylesToSave.map(s => ({
        salon_id: existingSalonId, name: s.styleName, category: 'Autre',
        price: parseFloat(s.price || '0'), duration_minutes: parseInt(s.duration || '60'),
        service_location: s.location, is_active: true
      }));
      await salonService.upsertServicesBatch(payload as any);
      Alert.alert('Succès', 'Prestations mises à jour.');
      setIsBatchConfiguring(false);
      loadData();
    } catch (e) { Alert.alert('Erreur', 'Sauvegarde échouée.'); }
    finally { setIsSaving(false); }
  };

  // ─── RENDU ────────────────────────────────

  if (!isAuthenticated) return <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Veuillez vous connecter</Text></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Sous-onglets de Vitrine */}
      <View style={[styles.mainTabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.mainTab, activeMainTab === 'info' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveMainTab('info')}
        >
          <Text style={[styles.mainTabText, { color: activeMainTab === 'info' ? colors.primary : colors.textSecondary }]}>Infos Salon</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mainTab, activeMainTab === 'prestations' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => setActiveMainTab('prestations')}
        >
          <Text style={[styles.mainTabText, { color: activeMainTab === 'prestations' ? colors.primary : colors.textSecondary }]}>Prestations & Tarifs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* VUE INFOS SALON */}
        {activeMainTab === 'info' && (
          <View style={styles.padding}>
            <Text style={styles.sectionTitle}>Ma devanture</Text>
            <TouchableOpacity style={styles.coverUpload} onPress={pickCover}>
              {coverPhoto ? <Image source={{ uri: coverPhoto }} style={styles.coverImg} /> : <View style={styles.coverPlaceholder}><Ionicons name="camera" size={32} color={colors.textMuted} /><Text style={{color:colors.textMuted}}>Photo de face du salon</Text></View>}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du salon *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={salonName} onChangeText={setSalonName} placeholder="Nom commercial" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Parlez de votre savoir-faire..." />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse complète *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={address} onChangeText={setAddress} placeholder="N°, rue, ville..." />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Politique d'Acompte (PRO)</Text>
            <View style={[styles.depositCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.rowBetween}>
                <Text style={{ fontWeight: '600', color: colors.text }}>Exiger un acompte</Text>
                <Switch value={requireDeposit} onValueChange={setRequireDeposit} trackColor={{ true: colors.primary }} />
              </View>
              {requireDeposit && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Pourcentage (%)</Text>
                  <TextInput style={[styles.input, { width: 80 }]} value={depositPercentage} onChangeText={setDepositPercentage} keyboardType="numeric" />
                </View>
              )}
            </View>

            <Button title="Enregistrer les infos" onPress={handleSaveSalon} loading={isSaving} style={{ marginTop: 32 }} />
          </View>
        )}

        {/* VUE PRESTATIONS */}
        {activeMainTab === 'prestations' && (
          <View style={styles.padding}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Mes Services ({configuredStyles.length})</Text>
              <TouchableOpacity onPress={() => Alert.alert('Aide', 'Sélectionnez des styles dans le catalogue pour les ajouter.')}>
                <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {configuredStyles.map(s => (
              <View key={s.styleId} style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>{s.styleName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{s.price} € • {s.duration} min</Text>
                </View>
                <TouchableOpacity onPress={() => { setSelectedStyleIds([s.styleId]); startBatch(); }}>
                  <Ionicons name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Catalogue Afro</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Cochez de nouveaux styles à proposer :</Text>
            <View style={styles.stylesGrid}>
              {HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).map(style => {
                const isSel = selectedStyleIds.includes(style.id);
                return (
                  <TouchableOpacity key={style.id} style={[styles.styleChip, { borderColor: isSel ? colors.primary : colors.border, backgroundColor: isSel ? colors.primary + '10' : colors.card }]} onPress={() => toggleStyleSelection(style.id)}>
                    <Text style={[styles.chipText, { color: isSel ? colors.primary : colors.text }]} numberOfLines={1}>{style.name}</Text>
                    {isSel && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      {/* Bouton flottant pour configuration rapide */}
      {activeMainTab === 'prestations' && selectedStyleIds.length > 0 && (
        <TouchableOpacity style={styles.floatingBtn} onPress={startBatch}>
          <Text style={styles.floatingBtnText}>Configurer ({selectedStyleIds.length})</Text>
        </TouchableOpacity>
      )}

      {/* MODAL CONFIGURATION */}
      <Modal visible={isBatchConfiguring} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsBatchConfiguring(false)}><Text style={{ color: colors.textSecondary }}>Annuler</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Prix & Durées</Text>
            <TouchableOpacity onPress={saveBatch}><Text style={{ color: colors.primary, fontWeight: '700' }}>Terminer</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {selectedStyleIds.map(id => (
              <View key={id} style={styles.batchItem}>
                <Text style={{ fontWeight: '700', marginBottom: 12 }}>{batchData[id]?.styleName}</Text>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Prix (€)</Text>
                    <TextInput style={styles.input} value={batchData[id]?.price} onChangeText={v => setBatchData(prev => ({ ...prev, [id]: { ...prev[id], price: v } }))} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Durée (min)</Text>
                    <TextInput style={styles.input} value={batchData[id]?.duration} onChangeText={v => setBatchData(prev => ({ ...prev, [id]: { ...prev[id], duration: v } }))} keyboardType="numeric" />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainTabs: { flexDirection: 'row', height: 50 },
  mainTab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainTabText: { fontWeight: '700', fontSize: 14 },
  padding: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  coverUpload: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, opacity: 0.7 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  depositCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stylesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  styleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
  floatingBtn: { position: 'absolute', bottom: 30, left: 20, right: 30, backgroundColor: '#191919', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...Shadows.md },
  floatingBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontWeight: '800', fontSize: 17 },
  batchItem: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row' }
});
