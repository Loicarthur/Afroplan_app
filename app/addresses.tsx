/**
 * Ecran de gestion des adresses client - AfroPlan
 * Permet aux clients de gerer leurs adresses pour les services a domicile
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { clientService } from '@/services';
import { ClientAddress, ClientAddressInsert, ClientAddressUpdate } from '@/types';

type AddressFormData = {
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  instructions: string;
  is_default: boolean;
};

const INITIAL_FORM: AddressFormData = {
  label: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: 'France',
  instructions: '',
  is_default: false,
};

const ADDRESS_LABELS = [
  { id: 'home', label: 'Domicile', icon: 'home' },
  { id: 'work', label: 'Travail', icon: 'briefcase' },
  { id: 'other', label: 'Autre', icon: 'location' },
];

export default function AddressesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ClientAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM);

  // Charger les adresses
  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await clientService.getAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      console.error('Erreur chargement adresses:', error);
      Alert.alert('Erreur', 'Impossible de charger vos adresses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  // Ouvrir le modal pour ajouter
  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData(INITIAL_FORM);
    setModalVisible(true);
  };

  // Ouvrir le modal pour editer
  const handleEditAddress = (address: ClientAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      postal_code: address.postal_code,
      country: address.country || 'France',
      instructions: address.instructions || '',
      is_default: address.is_default,
    });
    setModalVisible(true);
  };

  // Sauvegarder l'adresse
  const handleSaveAddress = async () => {
    if (!user?.id) return;

    // Validation
    if (!formData.address_line1.trim()) {
      Alert.alert('Erreur', 'L\'adresse est obligatoire');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Erreur', 'La ville est obligatoire');
      return;
    }
    if (!formData.postal_code.trim()) {
      Alert.alert('Erreur', 'Le code postal est obligatoire');
      return;
    }

    setSaving(true);

    try {
      if (editingAddress) {
        // Mise a jour
        const updates: ClientAddressUpdate = {
          label: formData.label || undefined,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || undefined,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          instructions: formData.instructions || undefined,
          is_default: formData.is_default,
        };
        await clientService.updateAddress(editingAddress.id, user.id, updates);
        Alert.alert('Succes', 'Adresse mise a jour');
      } else {
        // Creation
        const newAddress: ClientAddressInsert = {
          user_id: user.id,
          label: formData.label || undefined,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || undefined,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          instructions: formData.instructions || undefined,
          is_default: formData.is_default || addresses.length === 0,
        };
        await clientService.addAddress(newAddress);
        Alert.alert('Succes', 'Adresse ajoutee');
      }

      setModalVisible(false);
      loadAddresses();
    } catch (error) {
      console.error('Erreur sauvegarde adresse:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'adresse');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une adresse
  const handleDeleteAddress = (address: ClientAddress) => {
    Alert.alert(
      'Supprimer l\'adresse',
      'Etes-vous sur de vouloir supprimer cette adresse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await clientService.deleteAddress(address.id, user.id);
              Alert.alert('Succes', 'Adresse supprimee');
              loadAddresses();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');
            }
          },
        },
      ]
    );
  };

  // Definir comme adresse par defaut
  const handleSetDefault = async (address: ClientAddress) => {
    if (!user?.id || address.is_default) return;

    try {
      await clientService.setDefaultAddress(address.id, user.id);
      loadAddresses();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de definir l\'adresse par defaut');
    }
  };

  // Obtenir l'icone pour un label
  const getLabelIcon = (label: string | null): string => {
    const found = ADDRESS_LABELS.find(l => l.label.toLowerCase() === label?.toLowerCase());
    return found?.icon || 'location';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mes adresses</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Gerez vos adresses pour les services a domicile
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Liste des adresses */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aucune adresse
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ajoutez une adresse pour faciliter vos reservations de services a domicile
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleAddAddress}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Ajouter une adresse</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[styles.addressCard, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => handleEditAddress(address)}
              activeOpacity={0.7}
            >
              <View style={styles.addressHeader}>
                <View style={[styles.addressIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons
                    name={getLabelIcon(address.label) as any}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.addressTitleRow}>
                    <Text style={[styles.addressLabel, { color: colors.text }]}>
                      {address.label || 'Adresse'}
                    </Text>
                    {address.is_default && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.defaultBadgeText}>Par defaut</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {address.address_line1}
                  </Text>
                  {address.address_line2 && (
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                      {address.address_line2}
                    </Text>
                  )}
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {address.postal_code} {address.city}
                  </Text>
                  {address.instructions && (
                    <View style={styles.instructionsRow}>
                      <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.instructionsText, { color: colors.textMuted }]}>
                        {address.instructions}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.addressActions}>
                {!address.is_default && (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => handleSetDefault(address)}
                  >
                    <Ionicons name="star-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => handleEditAddress(address)}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: '#EF444450' }]}
                  onPress={() => handleDeleteAddress(address)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal d'ajout/edition */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </Text>
            <TouchableOpacity onPress={handleSaveAddress} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Label */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Type d'adresse</Text>
            <View style={styles.labelOptions}>
              {ADDRESS_LABELS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.labelOption,
                    {
                      backgroundColor: formData.label === item.label ? colors.primary : colors.card,
                      borderColor: formData.label === item.label ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, label: item.label })}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={formData.label === item.label ? '#FFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.labelOptionText,
                      { color: formData.label === item.label ? '#FFF' : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Adresse ligne 1 */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Adresse *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={formData.address_line1}
              onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
              placeholder="Numero et nom de rue"
              placeholderTextColor={colors.textMuted}
            />

            {/* Adresse ligne 2 */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Complement</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={formData.address_line2}
              onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
              placeholder="Batiment, etage, code..."
              placeholderTextColor={colors.textMuted}
            />

            {/* Ville et Code postal */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Code postal *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={formData.postal_code}
                  onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                  placeholder="75001"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Ville *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Paris"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Pays */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Pays</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="France"
              placeholderTextColor={colors.textMuted}
            />

            {/* Instructions */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Instructions de livraison</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={formData.instructions}
              onChangeText={(text) => setFormData({ ...formData, instructions: text })}
              placeholder="Instructions pour le coiffeur (code portail, interphone...)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Adresse par defaut */}
            <TouchableOpacity
              style={[styles.defaultToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
            >
              <View style={styles.defaultToggleContent}>
                <Ionicons
                  name="star"
                  size={20}
                  color={formData.is_default ? '#F59E0B' : colors.textMuted}
                />
                <Text style={[styles.defaultToggleText, { color: colors.text }]}>
                  Definir comme adresse par defaut
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: formData.is_default ? colors.primary : 'transparent',
                    borderColor: formData.is_default ? colors.primary : colors.border,
                  },
                ]}
              >
                {formData.is_default && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  addressCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addressHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  instructionsText: {
    fontSize: FontSizes.xs,
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.md,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  labelOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  labelOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  defaultToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  defaultToggleText: {
    fontSize: FontSizes.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
