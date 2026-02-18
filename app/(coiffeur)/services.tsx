/**
 * Page de gestion des styles - Espace Coiffeur AfroPlan
 * Catalogue de styles afro prédéfinis avec configuration prix/durée/lieu
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  subStyle: string;
  isActive: boolean;
};

// Catégorie "Autre" additionnelle
const EXTRA_CATEGORY = {
  id: 'autre',
  number: '',
  emoji: '✏️',
  title: 'Autre',
  color: '#808080',
  styles: [{ id: 'autre-service', name: 'Autre prestation', image: '' }],
};

const ALL_SERVICE_CATEGORIES = [...HAIRSTYLE_CATEGORIES, EXTRA_CATEGORY];

// Mock data
const MOCK_SERVICES: ServiceItem[] = [
  {
    id: '1',
    name: 'Tresses africaines',
    description: 'Tresses traditionnelles africaines, style au choix',
    price: 80,
    duration: 120,
    category: 'Tresses et Nattes',
    subStyle: 'Cornrows / Nattes collées',
    isActive: true,
  },
  {
    id: '2',
    name: 'Box Braids',
    description: 'Box braids de toutes tailles',
    price: 150,
    duration: 240,
    category: 'Tresses et Nattes',
    subStyle: 'Box Braids',
    isActive: true,
  },
  {
    id: '3',
    name: 'Coupe femme / homme',
    description: 'Coupe + finitions, tous types de cheveux',
    price: 25,
    duration: 45,
    category: 'Coupe & Restructuration',
    subStyle: 'Coupe',
    isActive: true,
  },
  {
    id: '4',
    name: 'Entretien locks',
    description: 'Reprise des racines et soins',
    price: 60,
    duration: 90,
    category: 'Locs',
    subStyle: 'Locks (création / entretien)',
    isActive: true,
  },
];

export default function CoiffeurServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [subStyle, setSubStyle] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setCategory('');
    setSubStyle('');
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setCategory(service.category);
    setSubStyle(service.subStyle ?? '');
    setModalVisible(true);
  };

  // Sub-styles available for the selected main category
  const availableSubStyles =
    ALL_SERVICE_CATEGORIES.find((c) => c.title === category)?.styles ?? [];

  const handleSave = () => {
    if (!name.trim() || !price.trim() || !duration.trim() || !category) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingService) {
      // Update existing service
      setServices(prev =>
        prev.map(s =>
          s.id === editingService.id
            ? {
                ...s,
                name,
                description,
                price: parseFloat(price),
                duration: parseInt(duration, 10),
                category,
                subStyle,
              }
            : s
        )
      );
    } else {
      // Add new service
      const newService: ServiceItem = {
        id: Date.now().toString(),
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        category,
        subStyle,
        isActive: true,
      };
      setServices(prev => [...prev, newService]);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleRemoveStyle = (styleId: string) => {
    Alert.alert(
      'Retirer ce style',
      'Voulez-vous retirer ce style de vos prestations ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () =>
            setConfiguredStyles((prev) => prev.filter((s) => s.styleId !== styleId)),
        },
      ]
    );
  };

  const handleSaveConfig = () => {
    if (!pendingStyle) return;
    if (!configPrice.trim() || !configDuration.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner le prix et la durée.');
      return;
    }
    const priceVal = parseFloat(configPrice);
    const durVal = parseInt(configDuration, 10);
    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert('Prix invalide', 'Entrez un prix valide (ex: 80).');
      return;
    }
    if (isNaN(durVal) || durVal <= 0) {
      Alert.alert('Durée invalide', 'Entrez une durée en minutes (ex: 120).');
      return;
    }

    const newEntry: ConfiguredStyle = {
      styleId: pendingStyle.id,
      styleName: pendingStyle.name,
      categoryLabel: pendingStyle.categoryLabel,
      price: configPrice,
      duration: configDuration,
      location: configLocation,
    };

    setConfiguredStyles((prev) => {
      const exists = prev.find((s) => s.styleId === pendingStyle.id);
      if (exists) {
        return prev.map((s) => (s.styleId === pendingStyle.id ? newEntry : s));
      }
      return [...prev, newEntry];
    });

    setConfigModal(false);
    setPendingStyle(null);
  };

  const formatDuration = (minutes: string) => {
    const m = parseInt(minutes, 10);
    if (isNaN(m)) return `${minutes}min`;
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h${rem}` : `${h}h`;
  };

  const locationLabel = (loc: ServiceLocation) => {
    if (loc === 'salon') return 'En salon';
    if (loc === 'domicile') return 'À domicile';
    return 'Salon & Domicile';
  };

  const locationIcon = (loc: ServiceLocation): 'storefront-outline' | 'home-outline' | 'swap-horizontal-outline' => {
    if (loc === 'salon') return 'storefront-outline';
    if (loc === 'domicile') return 'home-outline';
    return 'swap-horizontal-outline';
  };

  // ─── AUTH GUARD ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="cut" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mes styles</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour sélectionner vos styles et gérer vos prestations
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

  // ─── RENDU PRINCIPAL ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'catalog' && styles.tabActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'catalog' ? colors.primary : colors.textSecondary }]}>
            Catalogue
          </Text>
          {activeTab === 'catalog' && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_styles' && styles.tabActive]}
          onPress={() => setActiveTab('my_styles')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'my_styles' ? colors.primary : colors.textSecondary }]}>
            Mes styles ({configuredStyles.length})
          </Text>
          {activeTab === 'my_styles' && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      </View>

        {/* Services List */}
        <View style={styles.servicesList}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cut-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucun service
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Ajoutez vos services pour que les clients puissent les reserver
              </Text>
              <Button
                title="Ajouter un service"
                onPress={openAddModal}
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          ) : (
            services.map((service) => (
              <View
                key={service.id}
                style={[
                  styles.serviceCard,
                  { backgroundColor: colors.card },
                  !service.isActive && styles.serviceCardInactive,
                  Shadows.sm,
                ]}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: colors.text }]}>
                      {service.name}
                    </Text>
                    <View style={styles.categoryBadgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>
                          {service.category}
                        </Text>
                      </View>
                      {service.subStyle ? (
                        <View style={[styles.subStyleBadge, { backgroundColor: '#191919' + '12' }]}>
                          <Text style={[styles.subStyleText, { color: colors.textSecondary }]}>
                            {service.subStyle}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.myStyleActions}>
                      <TouchableOpacity
                        style={[styles.myStyleEditBtn, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          const styleEntry = STYLE_CATALOG
                            .flatMap((c) => c.styles.map((s) => ({ ...s, categoryLabel: c.label })))
                            .find((s) => s.id === cs.styleId);
                          if (styleEntry) openConfigModal(styleEntry, styleEntry.categoryLabel);
                        }}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.myStyleDeleteBtn, { borderColor: colors.error }]}
                        onPress={() => handleRemoveStyle(cs.styleId)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.myStyleDetails}>
                    <View style={[styles.myStyleBadge, { backgroundColor: '#22C55E20' }]}>
                      <Ionicons name="cash-outline" size={14} color="#22C55E" />
                      <Text style={[styles.myStyleBadgeText, { color: '#22C55E' }]}>{cs.price} €</Text>
                    </View>
                    <View style={[styles.myStyleBadge, { backgroundColor: '#3B82F620' }]}>
                      <Ionicons name="time-outline" size={14} color="#3B82F6" />
                      <Text style={[styles.myStyleBadgeText, { color: '#3B82F6' }]}>{formatDuration(cs.duration)}</Text>
                    </View>
                    <View style={[styles.myStyleBadge, { backgroundColor: '#7C3AED20' }]}>
                      <Ionicons name={locationIcon(cs.location)} size={14} color="#7C3AED" />
                      <Text style={[styles.myStyleBadgeText, { color: '#7C3AED' }]}>{locationLabel(cs.location)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: Spacing.xxl }} />
          </View>
        )}
      </ScrollView>

      {/* ─── MODAL CONFIGURATION STYLE ─────────────────────────────────────── */}
      <Modal
        visible={configModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setConfigModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setConfigModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
              {pendingStyle?.name}
            </Text>
            <TouchableOpacity onPress={handleSaveConfig}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Prix */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Prix (€) *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 80"
                placeholderTextColor={colors.textMuted}
                value={configPrice}
                onChangeText={setConfigPrice}
                keyboardType="numeric"
              />
            </View>

            {/* Durée */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Durée estimée (minutes) *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 120"
                placeholderTextColor={colors.textMuted}
                value={configDuration}
                onChangeText={setConfigDuration}
                keyboardType="numeric"
              />
              <Text style={[styles.formHint, { color: colors.textMuted }]}>
                240 min = 4h, 90 min = 1h30, etc.
              </Text>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Prix (EUR) *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.md }]}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Duree (min) *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="60"
                  placeholderTextColor={colors.textMuted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Catégorie principale */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Catégorie principale *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={styles.categoriesGrid}>
                  {ALL_SERVICE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        category === cat.title && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => {
                        setCategory(cat.title);
                        setSubStyle('');
                      }}
                    >
                      <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          { color: category === cat.title ? '#FFFFFF' : colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {cat.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Sous-style (affiché après sélection de la catégorie) */}
            {category && availableSubStyles.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Style spécifique</Text>
                <View style={styles.subStylesGrid}>
                  {availableSubStyles.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.subStyleOption,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        subStyle === s.name && { backgroundColor: '#191919', borderColor: '#191919' },
                      ]}
                      onPress={() => setSubStyle(subStyle === s.name ? '' : s.name)}
                    >
                      <Text
                        style={[
                          styles.subStyleOptionText,
                          { color: subStyle === s.name ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 2,
    borderRadius: 2,
  },

  /* Catalogue */
  catalogContainer: { padding: Spacing.md },
  catalogHint: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  categorySection: { marginBottom: Spacing.lg },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    flex: 1,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  styleChip: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.sm,
    minWidth: 100,
    maxWidth: '47%',
    flex: 1,
  },
  styleChipTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  styleCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  styleChipName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  styleChipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  styleChipMetaText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  styleChipLocBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Mes styles */
  myStylesContainer: { padding: Spacing.md },
  myStyleCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  myStyleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  myStyleInfo: { flex: 1 },
  myStyleName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  subStyleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  subStyleText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  serviceDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  myStyleActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  myStyleEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStyleDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStyleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  myStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  myStyleBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  /* Modal */
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: FontSizes.md },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  formGroup: { marginBottom: Spacing.lg },
  formLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
  },
  formHint: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  locationPicker: {
    gap: Spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  categoryOption: {
    width: 100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryOptionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  subStylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subStyleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  subStyleOptionText: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },

  /* Auth prompt */
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
