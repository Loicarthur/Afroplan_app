/**
 * Page des reservations - Espace Coiffeur AfroPlan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

type BookingItem = {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: BookingStatus;
  paymentMethod: 'full' | 'deposit' | 'on_site';
  amountPaid: number;
  remainingAmount: number;
};

// Mock data
const MOCK_BOOKINGS: BookingItem[] = [
  {
    id: '1',
    clientName: 'Marie Dupont',
    service: 'Tresses africaines',
    date: "Aujourd'hui",
    time: '10:00',
    duration: '2h',
    price: 80,
    status: 'confirmed',
    paymentMethod: 'deposit',
    amountPaid: 10,
    remainingAmount: 70,
  },
  {
    id: '2',
    clientName: 'Jean Martin',
    service: 'Coupe homme',
    date: "Aujourd'hui",
    time: '14:30',
    duration: '45min',
    price: 25,
    status: 'pending',
    paymentMethod: 'on_site',
    amountPaid: 0,
    remainingAmount: 25,
  },
  {
    id: '3',
    clientName: 'Fatou Diallo',
    service: 'Box Braids',
    date: 'Demain',
    time: '09:00',
    duration: '4h',
    price: 150,
    status: 'confirmed',
    paymentMethod: 'full',
    amountPaid: 150,
    remainingAmount: 0,
  },
  {
    id: '4',
    clientName: 'Aminata Sy',
    service: 'Locks entretien',
    date: '5 Fev',
    time: '11:00',
    duration: '1h30',
    price: 60,
    status: 'pending',
    paymentMethod: 'deposit',
    amountPaid: 10,
    remainingAmount: 50,
  },
];

export default function CoiffeurReservationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [bookings, setBookings] = useState<BookingItem[]>(MOCK_BOOKINGS);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return booking.status !== 'cancelled';
    return booking.status === activeTab;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.accent;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirme';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Termine';
      case 'cancelled':
        return 'Annule';
    }
  };

  const getPaymentLabel = (method: 'full' | 'deposit' | 'on_site') => {
    switch (method) {
      case 'full':
        return 'Paye';
      case 'deposit':
        return 'Acompte';
      case 'on_site':
        return 'Au salon';
    }
  };

  const handleConfirm = (bookingId: string) => {
    Alert.alert(
      'Confirmer la reservation',
      'Voulez-vous confirmer cette reservation?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            setBookings(prev =>
              prev.map(b =>
                b.id === bookingId ? { ...b, status: 'confirmed' } : b
              )
            );
          },
        },
      ]
    );
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Annuler la reservation',
      'Voulez-vous vraiment annuler cette reservation?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            setBookings(prev =>
              prev.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
              )
            );
          },
        },
      ]
    );
  };

  // Si pas connecté → écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="calendar" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Réservations</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour voir et gérer les réservations de vos clients
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
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'all' ? colors.primary : colors.textSecondary }]}>
            Toutes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.primary : colors.textSecondary }]}>
            En attente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('confirmed')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'confirmed' ? colors.primary : colors.textSecondary }]}>
            Confirmees
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Aucune reservation
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Les reservations apparaitront ici
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: colors.card }, Shadows.sm]}
              >
                {/* Header */}
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingDateTime}>
                    <Text style={[styles.bookingDate, { color: colors.text }]}>
                      {booking.date}
                    </Text>
                    <Text style={[styles.bookingTime, { color: colors.primary }]}>
                      {booking.time} - {booking.duration}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>

                {/* Client & Service */}
                <View style={styles.bookingDetails}>
                  <View style={styles.clientInfo}>
                    <Ionicons name="person-circle-outline" size={40} color={colors.textMuted} />
                    <View style={styles.clientText}>
                      <Text style={[styles.clientName, { color: colors.text }]}>
                        {booking.clientName}
                      </Text>
                      <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
                        {booking.service}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={[styles.paymentInfo, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                      Mode de paiement
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.text }]}>
                      {getPaymentLabel(booking.paymentMethod)}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                      Paye
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.success }]}>
                      {booking.amountPaid} EUR
                    </Text>
                  </View>
                  {booking.remainingAmount > 0 && (
                    <View style={styles.paymentRow}>
                      <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                        Reste a payer
                      </Text>
                      <Text style={[styles.paymentValue, { color: colors.accent }]}>
                        {booking.remainingAmount} EUR
                      </Text>
                    </View>
                  )}
                  <View style={[styles.paymentRow, styles.paymentTotal]}>
                    <Text style={[styles.paymentLabel, { color: colors.text, fontWeight: '600' }]}>
                      Total
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.primary, fontWeight: '700' }]}>
                      {booking.price} EUR
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {booking.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.success }]}
                      onPress={() => handleConfirm(booking.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
                      onPress={() => handleCancel(booking.id)}
                    >
                      <Ionicons name="close" size={20} color={colors.error} />
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.md,
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
    marginTop: Spacing.sm,
  },
  bookingCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  bookingDateTime: {},
  bookingDate: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  bookingTime: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  bookingDetails: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientText: {
    marginLeft: Spacing.sm,
  },
  clientName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  paymentInfo: {
    padding: Spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  paymentLabel: {
    fontSize: FontSizes.sm,
  },
  paymentValue: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  confirmButton: {},
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF',
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
