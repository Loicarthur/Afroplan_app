/**
 * Page Services Salon - AfroPlan
 * Gestion des prestations du salon
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  active: boolean;
}

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Tresses classiques', category: 'Tresses', price: 45, duration: 120, active: true },
  { id: '2', name: 'Tresses avec rajouts', category: 'Tresses', price: 65, duration: 180, active: true },
  { id: '3', name: 'Locks creation', category: 'Locks', price: 80, duration: 240, active: true },
  { id: '4', name: 'Locks entretien', category: 'Locks', price: 40, duration: 90, active: true },
  { id: '5', name: 'Coupe homme', category: 'Coupe', price: 20, duration: 30, active: false },
  { id: '6', name: 'Coloration', category: 'Coloration', price: 55, duration: 120, active: true },
];

export default function SalonServicesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [services] = useState(MOCK_SERVICES);

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Services</Text>
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Ajout de service a venir')}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
              {category}
            </Text>
            {services
              .filter(s => s.category === category)
              .map((service) => (
                <View
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    { backgroundColor: colors.card, opacity: service.active ? 1 : 0.6 },
                    Shadows.sm,
                  ]}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: colors.text }]}>
                      {service.name}
                    </Text>
                    <View style={styles.serviceDetails}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.serviceDuration, { color: colors.textMuted }]}>
                        {service.duration} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={[styles.servicePrice, { color: colors.primary }]}>
                      {service.price} EUR
                    </Text>
                    <View style={[
                      styles.activeIndicator,
                      { backgroundColor: service.active ? colors.success : colors.textMuted },
                    ]} />
                  </View>
                </View>
              ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  categorySection: {
    gap: Spacing.sm,
  },
  categoryTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  serviceDuration: {
    fontSize: FontSizes.sm,
  },
  serviceRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  servicePrice: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
