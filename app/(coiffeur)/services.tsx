/**
 * Page de gestion des services - Espace Coiffeur AfroPlan
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

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
};

const CATEGORIES = [
  'Tresses',
  'Locks',
  'Coupe',
  'Coloration',
  'Soins',
  'Extensions',
  'Barber',
  'Autre',
];

// Mock data
const MOCK_SERVICES: ServiceItem[] = [
  {
    id: '1',
    name: 'Tresses africaines',
    description: 'Tresses traditionnelles africaines, style au choix',
    price: 80,
    duration: 120,
    category: 'Tresses',
    isActive: true,
  },
  {
    id: '2',
    name: 'Box Braids',
    description: 'Box braids de toutes tailles',
    price: 150,
    duration: 240,
    category: 'Tresses',
    isActive: true,
  },
  {
    id: '3',
    name: 'Coupe homme',
    description: 'Coupe + degrade + finitions',
    price: 25,
    duration: 45,
    category: 'Coupe',
    isActive: true,
  },
  {
    id: '4',
    name: 'Entretien locks',
    description: 'Reprise des racines et soins',
    price: 60,
    duration: 90,
    category: 'Locks',
    isActive: true,
  },
];

export default function CoiffeurServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setCategory('');
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
    setModalVisible(true);
  };

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
        isActive: true,
      };
      setServices(prev => [...prev, newService]);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (serviceId: string) => {
    Alert.alert(
      'Supprimer le service',
      'Voulez-vous vraiment supprimer ce service?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(s => s.id !== serviceId));
          },
        },
      ]
    );
  };

  const toggleServiceActive = (serviceId: string) => {
    setServices(prev =>
      prev.map(s =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Mes services
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
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
                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.categoryText, { color: colors.primary }]}>
                        {service.category}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => toggleServiceActive(service.id)}
                  >
                    <Ionicons
                      name={service.isActive ? 'toggle' : 'toggle-outline'}
                      size={32}
                      color={service.isActive ? colors.success : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {service.description && (
                  <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
                    {service.description}
                  </Text>
                )}

                <View style={styles.serviceDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {service.price} EUR
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {formatDuration(service.duration)}
                    </Text>
                  </View>
                </View>

                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => openEditModal(service)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: colors.error }]}
                    onPress={() => handleDelete(service.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Nom du service *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Tresses africaines"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Description du service..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
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

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Categorie *</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      category === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { color: category === cat ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesList: {
    paddingHorizontal: Spacing.md,
  },
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
  },
  serviceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceCardInactive: {
    opacity: 0.6,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  serviceDescription: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
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
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
});
