/**
 * Page Reservations Salon - AfroPlan
 * Liste et gestion des reservations du salon
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

interface Reservation {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price: number;
}

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    clientName: 'Marie Dupont',
    service: 'Tresses africaines',
    date: '2025-01-20',
    time: '10:00',
    status: 'confirmed',
    price: 65,
  },
  {
    id: '2',
    clientName: 'Fatou Diallo',
    service: 'Locks entretien',
    date: '2025-01-20',
    time: '14:00',
    status: 'pending',
    price: 45,
  },
  {
    id: '3',
    clientName: 'Aminata Bamba',
    service: 'Coupe + Coloration',
    date: '2025-01-19',
    time: '11:00',
    status: 'completed',
    price: 80,
  },
  {
    id: '4',
    clientName: 'Sophie Martin',
    service: 'Twists',
    date: '2025-01-18',
    time: '09:00',
    status: 'cancelled',
    price: 55,
  },
];

export default function SalonReservationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return colors.primary;
      case 'pending': return colors.accent;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirme';
      case 'pending': return 'En attente';
      case 'completed': return 'Termine';
      case 'cancelled': return 'Annule';
    }
  };

  const filteredReservations = MOCK_RESERVATIONS.filter(
    r => filter === 'all' || r.status === filter
  );

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmees' },
    { key: 'completed', label: 'Terminees' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reservations</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.card,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucune reservation trouvee
            </Text>
          </View>
        ) : (
          filteredReservations.map((reservation) => (
            <TouchableOpacity
              key={reservation.id}
              style={[styles.reservationCard, { backgroundColor: colors.card }, Shadows.sm]}
              onPress={() => router.push({
                pathname: '/chat/[bookingId]',
                params: { bookingId: reservation.id },
              })}
            >
              <View style={styles.reservationHeader}>
                <View style={styles.reservationInfo}>
                  <Text style={[styles.clientName, { color: colors.text }]}>
                    {reservation.clientName}
                  </Text>
                  <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
                    {reservation.service}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
                    {getStatusLabel(reservation.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.reservationFooter}>
                <View style={styles.dateTimeRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {reservation.date}
                  </Text>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {reservation.time}
                  </Text>
                </View>
                <Text style={[styles.priceText, { color: colors.text }]}>
                  {reservation.price} EUR
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
  },
  reservationCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reservationInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FontSizes.sm,
    marginRight: Spacing.sm,
  },
  priceText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
