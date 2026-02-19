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

// ─── CATALOGUE DES STYLES AFRO PRÉDÉFINIS ───────────────────────────────────

type StyleEntry = {
  id: string;
  name: string;
};

type StyleCategory = {
  id: string;
  label: string;
  emoji: string;
  styles: StyleEntry[];
};

const STYLE_CATALOG: StyleCategory[] = [
  {
    id: 'naturels',
    label: 'Naturels / Cheveux libres',
    emoji: '🌿',
    styles: [
      { id: 'wash_go', name: 'Wash & Go' },
    ],
  },
  {
    id: 'tresses',
    label: 'Tresses et Nattes',
    emoji: '🪮',
    styles: [
      { id: 'box_braids', name: 'Box Braids' },
      { id: 'knotless_braids', name: 'Knotless Braids' },
      { id: 'boho_braids', name: 'Boho Braids' },
      { id: 'cornrows', name: 'Cornrows / Nattes collées' },
      { id: 'fulani_braids', name: 'Fulani Braids' },
      { id: 'micro_braids', name: 'Micro Braids' },
      { id: 'crochet_braids', name: 'Crochet Braids' },
    ],
  },
  {
    id: 'vanilles',
    label: 'Vanilles & Twists',
    emoji: '🔄',
    styles: [
      { id: 'vanilles', name: 'Vanilles' },
      { id: 'barrel_twist', name: 'Barrel Twist' },
    ],
  },
  {
    id: 'locs',
    label: 'Locs',
    emoji: '🔒',
    styles: [
      { id: 'locks', name: 'Locks (création / entretien)' },
      { id: 'faux_locs', name: 'Faux Locs' },
      { id: 'dreadlocks', name: 'Dreadlocks naturelles' },
      { id: 'sisterlocks', name: 'Sisterlocks' },
    ],
  },
  {
    id: 'boucles',
    label: 'Boucles et Ondulations',
    emoji: '🌸',
    styles: [
      { id: 'bantu_knots', name: 'Bantu Knots' },
    ],
  },
  {
    id: 'tissages',
    label: 'Tissages & Perruques',
    emoji: '💇🏽‍♀️',
    styles: [
      { id: 'tissage', name: 'Tissage' },
      { id: 'perruque', name: 'Pose de Perruque' },
      { id: 'flip_over', name: 'Flip Over' },
      { id: 'tape_in', name: 'Tape-in' },
    ],
  },
  {
    id: 'ponytail',
    label: 'Ponytail',
    emoji: '🎀',
    styles: [
      { id: 'ponytail', name: 'Ponytail' },
    ],
  },
  {
    id: 'coupe',
    label: 'Coupe & Restructuration',
    emoji: '✂️',
    styles: [
      { id: 'coupe', name: 'Coupe' },
      { id: 'restructuration', name: 'Restructuration' },
    ],
  },
  {
    id: 'soins',
    label: 'Soins, Lissage & Coloration',
    emoji: '✨',
    styles: [
      { id: 'lissage', name: 'Lissage' },
      { id: 'soin', name: 'Soin' },
      { id: 'couleur', name: 'Couleur' },
      { id: 'balayage', name: 'Balayage' },
    ],
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ServiceLocation = 'salon' | 'domicile' | 'both';

type ConfiguredStyle = {
  styleId: string;
  styleName: string;
  categoryLabel: string;
  price: string;
  duration: string;
  location: ServiceLocation;
  requiresExtensions: boolean;
  extensionsIncluded: boolean;
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function CoiffeurServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  // Styles sélectionnés et configurés
  const [configuredStyles, setConfiguredStyles] = useState<ConfiguredStyle[]>([]);

  // Modal de configuration d'un style
  const [configModal, setConfigModal] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<StyleEntry & { categoryLabel: string } | null>(null);
  const [configPrice, setConfigPrice] = useState('');
  const [configDuration, setConfigDuration] = useState('');
  const [configLocation, setConfigLocation] = useState<ServiceLocation>('salon');
  const [requiresExtensions, setRequiresExtensions] = useState(false);
  const [extensionsIncluded, setExtensionsIncluded] = useState(false);

  // Vue catalogue ou vue "mes styles"
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_styles'>('catalog');

  const isStyleConfigured = (styleId: string) =>
    configuredStyles.some((s) => s.styleId === styleId);

  const getConfiguredStyle = (styleId: string) =>
    configuredStyles.find((s) => s.styleId === styleId);

  const openConfigModal = (style: StyleEntry, categoryLabel: string) => {
    const existing = getConfiguredStyle(style.id);
    if (existing) {
      setConfigPrice(existing.price);
      setConfigDuration(existing.duration);
      setConfigLocation(existing.location);
      setRequiresExtensions(existing.requiresExtensions || false);
      setExtensionsIncluded(existing.extensionsIncluded || false);
    } else {
      setConfigPrice('');
      setConfigDuration('');
      setConfigLocation('salon');
      setRequiresExtensions(false);
      setExtensionsIncluded(false);
    }
    setPendingStyle({ ...style, categoryLabel });
    setConfigModal(true);
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
      requiresExtensions: requiresExtensions,
      extensionsIncluded: extensionsIncluded,
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

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── ONGLET CATALOGUE ─────────────────────────────────────────────── */}
        {activeTab === 'catalog' && (
          <View style={styles.catalogContainer}>
            <Text style={[styles.catalogHint, { color: colors.textSecondary }]}>
              Appuyez sur un style pour l&apos;ajouter à vos prestations et configurer votre tarif.
            </Text>

            {STYLE_CATALOG.map((category) => (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>{category.label}</Text>
                </View>

                <View style={styles.stylesGrid}>
                  {category.styles.map((style) => {
                    const configured = isStyleConfigured(style.id);
                    const config = getConfiguredStyle(style.id);
                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          styles.styleChip,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          configured && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                        ]}
                        onPress={() => openConfigModal(style, category.label)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.styleChipTop}>
                          {configured && (
                            <View style={[styles.styleCheck, { backgroundColor: colors.primary }]}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.styleChipName,
                              { color: configured ? colors.primary : colors.text },
                            ]}
                            numberOfLines={2}
                          >
                            {style.name}
                          </Text>
                        </View>
                        {configured && config && (
                          <View style={styles.styleChipMeta}>
                            <Text style={[styles.styleChipMetaText, { color: colors.primary }]}>
                              {config.price}€ · {formatDuration(config.duration)}
                            </Text>
                            <View style={styles.styleChipLocBadge}>
                              <Ionicons name={locationIcon(config.location)} size={11} color={colors.primary} />
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={{ height: Spacing.xxl }} />
          </View>
        )}

        {/* ─── ONGLET MES STYLES ────────────────────────────────────────────── */}
        {activeTab === 'my_styles' && (
          <View style={styles.myStylesContainer}>
            {configuredStyles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun style ajouté</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Allez dans le catalogue et sélectionnez les styles que vous proposez
                </Text>
                <Button
                  title="Voir le catalogue"
                  onPress={() => setActiveTab('catalog')}
                  style={{ marginTop: Spacing.lg }}
                />
              </View>
            ) : (
              configuredStyles.map((cs) => (
                <View
                  key={cs.styleId}
                  style={[styles.myStyleCard, { backgroundColor: colors.card }, Shadows.sm]}
                >
                  <View style={styles.myStyleCardHeader}>
                    <View style={styles.myStyleInfo}>
                      <Text style={[styles.myStyleName, { color: colors.text }]}>{cs.styleName}</Text>
                      <Text style={[styles.myStyleCategory, { color: colors.textMuted }]}>{cs.categoryLabel}</Text>
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

            {/* Lieu de prestation */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Lieu de prestation *</Text>
              <View style={styles.locationPicker}>
                {(
                  [
                    { value: 'salon', label: 'En salon', desc: 'Le client vient chez vous', icon: 'storefront-outline' },
                    { value: 'domicile', label: 'À domicile', desc: 'Vous vous déplacez chez le client', icon: 'home-outline' },
                    { value: 'both', label: 'Les deux', desc: 'Salon ou domicile', icon: 'swap-horizontal-outline' },
                  ] as { value: ServiceLocation; label: string; desc: string; icon: string }[]
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.locationOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      configLocation === opt.value && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                    ]}
                    onPress={() => setConfigLocation(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={configLocation === opt.value ? colors.primary : colors.textSecondary}
                    />
                    <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                      <Text style={[styles.locationOptionLabel, { color: configLocation === opt.value ? colors.primary : colors.text }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.locationOptionDesc, { color: colors.textMuted }]}>
                        {opt.desc}
                      </Text>
                    </View>
                    {configLocation === opt.value && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mèches / Extensions (Spécifique Afro) */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Gestion des mèches / extensions</Text>
              
              <TouchableOpacity 
                style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setRequiresExtensions(!requiresExtensions)}
                activeOpacity={0.7}
              >
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Mèches nécessaires</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                    Indique si cette coiffure nécessite des extensions
                  </Text>
                </View>
                <View style={[
                  styles.toggleSwitch, 
                  requiresExtensions && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { borderColor: colors.border }
                ]}>
                  {requiresExtensions && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>

              {requiresExtensions && (
                <TouchableOpacity 
                  style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.sm }]}
                  onPress={() => setExtensionsIncluded(!extensionsIncluded)}
                  activeOpacity={0.7}
                >
                  <View style={styles.toggleText}>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Mèches fournies par le salon</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                      Désactivez si la cliente doit apporter ses propres mèches
                    </Text>
                  </View>
                  <View style={[
                    styles.toggleSwitch, 
                    extensionsIncluded && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border }
                  ]}>
                    {extensionsIncluded && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
  myStyleCategory: {
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
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  locationOptionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  locationOptionDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
