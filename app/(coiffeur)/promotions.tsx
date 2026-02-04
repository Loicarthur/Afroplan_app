/**
 * Page de gestion des promotions - Espace Coiffeur AfroPlan
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { promotionService, salonService } from '@/services';
import { Promotion, PromotionInsert, PromotionType, PromotionStatus, Salon } from '@/types';

const PROMOTION_TYPES: { value: PromotionType; label: string; icon: string }[] = [
  { value: 'percentage', label: 'Pourcentage', icon: 'pricetag-outline' },
  { value: 'fixed_amount', label: 'Montant fixe', icon: 'cash-outline' },
  { value: 'free_service', label: 'Service offert', icon: 'gift-outline' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
];

export default function PromotionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<PromotionType>('percentage');
  const [value, setValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [newClientsOnly, setNewClientsOnly] = useState(false);
  const [validDays, setValidDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const salonData = await salonService.getSalonByOwnerId(user.id);
      if (!salonData) {
        Alert.alert('Salon requis', 'Creez d\'abord votre salon.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      setSalon(salonData);

      const { data } = await promotionService.getSalonPromotions(salonData.id);
      setPromotions(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCode('');
    setType('percentage');
    setValue('');
    setMinPurchaseAmount('0');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setMaxUses('');
    setMaxUsesPerUser('1');
    setNewClientsOnly(false);
    setValidDays([0, 1, 2, 3, 4, 5, 6]);
    setEditingPromotion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromotion(promo);
    setTitle(promo.title);
    setDescription(promo.description || '');
    setCode(promo.code || '');
    setType(promo.type);
    setValue(String(promo.value));
    setMinPurchaseAmount(String(promo.min_purchase_amount));
    setStartDate(promo.start_date.split('T')[0]);
    setEndDate(promo.end_date.split('T')[0]);
    setMaxUses(promo.max_uses ? String(promo.max_uses) : '');
    setMaxUsesPerUser(String(promo.max_uses_per_user));
    setNewClientsOnly(promo.new_clients_only);
    setValidDays(promo.valid_days || [0, 1, 2, 3, 4, 5, 6]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }
    if (!value || parseFloat(value) <= 0) {
      Alert.alert('Erreur', 'La valeur est obligatoire');
      return;
    }

    setIsSaving(true);

    try {
      const promoData: PromotionInsert = {
        salon_id: salon!.id,
        title: title.trim(),
        description: description.trim() || null,
        code: code.trim().toUpperCase() || null,
        type,
        value: parseFloat(value),
        min_purchase_amount: parseFloat(minPurchaseAmount) || 0,
        max_discount_amount: null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        max_uses: maxUses ? parseInt(maxUses) : null,
        max_uses_per_user: parseInt(maxUsesPerUser) || 1,
        new_clients_only: newClientsOnly,
        first_booking_only: false,
        valid_days: validDays.length === 7 ? null : validDays,
        status: 'active' as PromotionStatus,
        applicable_service_ids: null,
        applicable_categories: null,
        image_url: null,
        banner_url: null,
      };

      if (editingPromotion) {
        await promotionService.updatePromotion(editingPromotion.id, promoData);
      } else {
        await promotionService.createPromotion(promoData);
      }

      setShowModal(false);
      loadData();
      Alert.alert('Succes', editingPromotion ? 'Promotion mise a jour' : 'Promotion creee');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    try {
      if (promo.status === 'active') {
        await promotionService.pausePromotion(promo.id);
      } else {
        await promotionService.activatePromotion(promo.id);
      }
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleDelete = (promo: Promotion) => {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await promotionService.deletePromotion(promo.id);
            loadData();
          } catch (error: any) {
            Alert.alert('Erreur', error.message);
          }
        },
      },
    ]);
  };

  const toggleDay = (day: number) => {
    setValidDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case 'active': return colors.success;
      case 'paused': return colors.warning;
      case 'expired': return colors.error;
      default: return colors.textMuted;
    }
  };

  const formatValue = (promo: Promotion) => {
    switch (promo.type) {
      case 'percentage': return `-${promo.value}%`;
      case 'fixed_amount': return `-${promo.value}EUR`;
      case 'free_service': return 'Offert';
      default: return promo.value;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Mes Promotions' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Mes Promotions' }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Promotions</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Attirez plus de clients
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {promotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune promotion</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Creez votre premiere promotion
            </Text>
            <Button title="Creer une promotion" onPress={openCreateModal} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <View style={styles.list}>
            {promotions.map((promo) => (
              <TouchableOpacity
                key={promo.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openEditModal(promo)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.valueBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.valueText}>{formatValue(promo)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(promo.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(promo.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(promo.status) }]}>
                      {promo.status === 'active' ? 'Active' : promo.status === 'paused' ? 'Pause' : 'Expiree'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>{promo.title}</Text>
                {promo.code && (
                  <View style={[styles.codeBox, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>Code: {promo.code}</Text>
                  </View>
                )}

                <View style={styles.cardMeta}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {new Date(promo.start_date).toLocaleDateString('fr-FR')} - {new Date(promo.end_date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleToggleStatus(promo)}
                  >
                    <Ionicons name={promo.status === 'active' ? 'pause' : 'play'} size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={() => handleDelete(promo)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
              {editingPromotion ? 'Modifier' : 'Nouvelle promotion'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                {isSaving ? '...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Titre *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: -20% sur les tresses"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Decrivez votre offre..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Code promo</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: AFRO20"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeSelector}>
                {PROMOTION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      type === t.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setType(t.value)}
                  >
                    <Ionicons name={t.icon as any} size={20} color={type === t.value ? '#FFF' : colors.text} />
                    <Text style={[styles.typeLabel, { color: type === t.value ? '#FFF' : colors.text }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Valeur * {type === 'percentage' ? '(%)' : '(EUR)'}
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={type === 'percentage' ? '20' : '10'}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Date debut</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.md }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Date fin</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Jours valides</Text>
              <View style={styles.daysSelector}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      validDays.includes(day.value) && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[styles.dayLabel, { color: validDays.includes(day.value) ? '#FFF' : colors.text }]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.optionRow, { borderColor: colors.border }]}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Nouveaux clients uniquement</Text>
              <Switch
                value={newClientsOnly}
                onValueChange={setNewClientsOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Utilisations max</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Illimite"
                  placeholderTextColor={colors.textMuted}
                  value={maxUses}
                  onChangeText={setMaxUses}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.md }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Par client</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                  value={maxUsesPerUser}
                  onChangeText={setMaxUsesPerUser}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ height: Spacing.xxl * 2 }} />
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '600', marginTop: Spacing.lg },
  emptySubtitle: { fontSize: FontSizes.md, textAlign: 'center', marginTop: Spacing.sm },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  valueBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  valueText: { color: '#FFF', fontWeight: '700', fontSize: FontSizes.lg },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSizes.sm, fontWeight: '500' },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: '600' },
  codeBox: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  codeText: { fontSize: FontSizes.sm, fontWeight: '700' },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: Spacing.sm },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  typeLabel: { fontSize: FontSizes.sm, fontWeight: '500' },
  daysSelector: { flexDirection: 'row', gap: Spacing.xs },
  dayOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayLabel: { fontSize: FontSizes.sm, fontWeight: '500' },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  optionTitle: { fontSize: FontSizes.md, fontWeight: '500' },
});
