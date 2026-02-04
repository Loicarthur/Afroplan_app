/**
 * Page de gestion des zones de couverture - Espace Coiffeur AfroPlan
 * Permet aux coiffeurs de definir les zones ou ils se deplacent
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { coiffeurService } from '@/services';
import { CoverageZone, CoverageZoneInsert } from '@/types';

export default function ZonesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<CoverageZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Formulaire
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [department, setDepartment] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');
  const [additionalFee, setAdditionalFee] = useState('0');

  useEffect(() => {
    loadZones();
  }, [user]);

  const loadZones = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const data = await coiffeurService.getCoverageZones(user.id);
      setZones(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCity('');
    setPostalCode('');
    setDepartment('');
    setRadiusKm('10');
    setAdditionalFee('0');
    setEditingZone(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (zone: CoverageZone) => {
    setEditingZone(zone);
    setCity(zone.city);
    setPostalCode(zone.postal_code || '');
    setDepartment(zone.department || '');
    setRadiusKm(String(zone.radius_km));
    setAdditionalFee(String(zone.additional_fee));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!city.trim()) {
      Alert.alert('Erreur', 'La ville est obligatoire');
      return;
    }

    setIsSaving(true);

    try {
      const zoneData: CoverageZoneInsert = {
        coiffeur_id: user!.id,
        city: city.trim(),
        postal_code: postalCode.trim() || null,
        department: department.trim() || null,
        region: null,
        country: 'France',
        center_latitude: null,
        center_longitude: null,
        radius_km: parseInt(radiusKm) || 10,
        additional_fee: parseFloat(additionalFee) || 0,
        is_active: true,
      };

      if (editingZone) {
        await coiffeurService.updateCoverageZone(editingZone.id, zoneData);
      } else {
        await coiffeurService.addCoverageZone(zoneData);
      }

      setShowModal(false);
      loadZones();
      Alert.alert('Succes', editingZone ? 'Zone mise a jour' : 'Zone ajoutee');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (zone: CoverageZone) => {
    Alert.alert('Supprimer', `Supprimer la zone ${zone.city} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await coiffeurService.deleteCoverageZone(zone.id);
            loadZones();
          } catch (error: any) {
            Alert.alert('Erreur', error.message);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Zones de couverture' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Zones de couverture' }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Zones de couverture</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Definissez ou vous vous deplacez
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Si vous n'ajoutez aucune zone, vous serez visible partout pour le service a domicile.
          </Text>
        </View>

        {/* Liste */}
        {zones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune zone</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ajoutez des zones pour cibler vos deplacements
            </Text>
            <Button title="Ajouter une zone" onPress={openCreateModal} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <View style={styles.list}>
            {zones.map((zone) => (
              <View
                key={zone.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="location" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{zone.city}</Text>
                    {zone.postal_code && (
                      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        {zone.postal_code} {zone.department ? `- ${zone.department}` : ''}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="resize-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      Rayon: {zone.radius_km} km
                    </Text>
                  </View>
                  {zone.additional_fee > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        +{zone.additional_fee} EUR
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => openEditModal(zone)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={() => handleDelete(zone)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingZone ? 'Modifier' : 'Nouvelle zone'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                {isSaving ? '...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Ville *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Paris"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Code postal</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="75000"
                  placeholderTextColor={colors.textMuted}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.md }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Departement</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="75"
                  placeholderTextColor={colors.textMuted}
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Rayon de couverture (km)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                value={radiusKm}
                onChangeText={setRadiusKm}
                keyboardType="numeric"
              />
              <Text style={[styles.formHint, { color: colors.textMuted }]}>
                Distance autour de la ville que vous acceptez de couvrir
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Frais supplementaires (EUR)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={additionalFee}
                onChangeText={setAdditionalFee}
                keyboardType="numeric"
              />
              <Text style={[styles.formHint, { color: colors.textMuted }]}>
                Frais de deplacement specifique a cette zone (en plus de vos frais standards)
              </Text>
            </View>

            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: '700' },
  headerSubtitle: { fontSize: FontSizes.sm, marginTop: 2 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: FontSizes.sm },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '600', marginTop: Spacing.lg },
  emptySubtitle: { fontSize: FontSizes.md, textAlign: 'center', marginTop: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: Spacing.md },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: '600' },
  cardSubtitle: { fontSize: FontSizes.sm, marginTop: 2 },
  cardMeta: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSizes.sm },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancel: { fontSize: FontSizes.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: '600' },
  modalSave: { fontSize: FontSizes.md, fontWeight: '600' },
  modalContent: { flex: 1, padding: Spacing.md },
  formGroup: { marginBottom: Spacing.lg },
  formRow: { flexDirection: 'row' },
  formLabel: { fontSize: FontSizes.md, fontWeight: '600', marginBottom: Spacing.sm },
  formInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  formHint: { fontSize: FontSizes.sm, marginTop: Spacing.xs },
});
