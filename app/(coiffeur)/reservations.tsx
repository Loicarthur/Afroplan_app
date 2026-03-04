/**
 * Page des reservations - Espace Coiffeur AfroPlan
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { bookingService } from '@/services/booking.service';
import { salonService } from '@/services/salon.service';
import { BookingWithDetails } from '@/types';

export default function CoiffeurReservationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isTodayBlocked, setIsTodayBlocked] = useState(false);

  // Modal d'annulation
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // 1. Récupérer le salon du coiffeur
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (!salon) {
        setLoading(false);
        return;
      }
      setSalonId(salon.id);

      // 2. Récupérer les réservations
      const response = await bookingService.getSalonBookings(salon.id);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleConfirm = async (bookingId: string) => {
    Alert.alert(
      t('coiffeur.confirmTitle'),
      t('coiffeur.confirmDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('coiffeur.confirm'),
          onPress: async () => {
            try {
              await bookingService.confirmBooking(bookingId);
              fetchBookings();
              Alert.alert(t('common.success'), t('coiffeur.confirmSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('coiffeur.confirmError'));
            }
          },
        },
      ]
    );
  };

  const openCancelModal = (bookingId: string) => {
    setSelectedBookingForCancel(bookingId);
    setIsCancelModalVisible(true);
  };

  const handleCancelByCoiffeur = async () => {
    if (!selectedBookingForCancel || !cancelReason.trim()) {
      Alert.alert(t('common.attention'), t('coiffeur.cancelReasonLabel'));
      return;
    }

    setIsSubmittingCancel(true);
    try {
      await bookingService.cancelBookingByCoiffeur(selectedBookingForCancel, cancelReason);
      setIsCancelModalVisible(false);
      setSelectedBookingForCancel(null);
      setCancelReason('');
      fetchBookings();
      Alert.alert(t('coiffeur.cancelTitle'), t('coiffeur.cancelSuccess'));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert(t('common.error'), t('coiffeur.cancelError'));
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return b.status !== 'cancelled';
    return b.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.primary;
      case 'completed': return colors.textMuted;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t('booking.confirmed');
      case 'pending': return t('booking.pending');
      case 'completed': return t('booking.completed');
      case 'cancelled': return t('booking.cancelled');
      default: return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="calendar" size={64} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>{t('booking.myReservations')}</Text>
          <Button title={t('auth.login')} onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['all', 'pending', 'confirmed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {t(`coiffeur.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.content}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('coiffeur.noReservations')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('coiffeur.reservationsAppear')}</Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.card }, Shadows.sm]}>
                <View style={styles.bookingHeader}>
                  <View>
                    <Text style={[styles.bookingDate, { color: colors.text }]}>{booking.booking_date}</Text>
                    <Text style={[styles.bookingTime, { color: colors.primary }]}>
                      {booking.start_time.substring(0, 5)} - {booking.service?.duration_minutes}min
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{getStatusLabel(booking.status)}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.clientInfo}>
                    <Ionicons name="person-circle-outline" size={40} color={colors.textMuted} />
                    <View style={styles.clientText}>
                      <Text style={[styles.clientName, { color: colors.text }]}>{booking.client?.full_name || 'Client'}</Text>
                      <Text style={[styles.serviceName, { color: colors.textSecondary }]}>{booking.service?.name || 'Prestation'}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.paymentInfo, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>{t('coiffeur.paidOnline')}</Text>
                    <Text style={[styles.paymentValue, { color: colors.success }]}>{booking.amount_paid} EUR</Text>
                  </View>
                  <View style={[styles.paymentRow, styles.paymentTotal]}>
                    <Text style={[styles.paymentLabel, { color: colors.text, fontWeight: '600' }]}>{t('coiffeur.total')}</Text>
                    <Text style={[styles.paymentValue, { color: colors.primary, fontWeight: '700' }]}>{booking.total_price} EUR</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  {booking.status === 'pending' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.success }]} onPress={() => handleConfirm(booking.id)}>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>{t('coiffeur.confirm')}</Text>
                    </TouchableOpacity>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (() => {
                    const [h, m] = booking.start_time.split(':').map(Number);
                    const bDateTime = new Date(booking.booking_date);
                    bDateTime.setHours(h, m, 0, 0);
                    const isPast = bDateTime < new Date();

                    if (isPast) return null;

                    return (
                      <TouchableOpacity 
                        style={[styles.actionButton, { borderColor: colors.error, borderWidth: 1 }]} 
                        onPress={() => openCancelModal(booking.id)}
                      >
                        <Ionicons name="close" size={18} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>{t('coiffeur.cancel')}</Text>
                      </TouchableOpacity>
                    );
                  })()}
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]} 
                    onPress={() => router.push({ pathname: '/chat/[bookingId]', params: { bookingId: booking.id } })}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('coiffeur.message')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Annulation */}
      <Modal visible={isCancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('coiffeur.cancelTitle')}</Text>
            <TextInput
              style={[styles.reasonInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('coiffeur.cancelReasonPlaceholder')}
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setIsCancelModalVisible(false)} style={{ flex: 1 }} />
              <Button title={t('coiffeur.confirmCancel')} onPress={handleCancelByCoiffeur} loading={isSubmittingCancel} style={{ flex: 1, backgroundColor: colors.error }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  bookingCard: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  bookingDate: { fontSize: 16, fontWeight: '600' },
  bookingTime: { fontSize: 14, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  bookingDetails: { paddingHorizontal: 16, paddingBottom: 16 },
  clientInfo: { flexDirection: 'row', alignItems: 'center' },
  clientText: { marginLeft: 12 },
  clientName: { fontSize: 16, fontWeight: '600' },
  serviceName: { fontSize: 14, marginTop: 2 },
  paymentInfo: { padding: 16 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  paymentTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  paymentLabel: { fontSize: 13 },
  paymentValue: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', padding: 16, gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  authTitle: { fontSize: 22, fontWeight: '700', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  reasonInput: { borderWidth: 1, borderRadius: 10, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
});
