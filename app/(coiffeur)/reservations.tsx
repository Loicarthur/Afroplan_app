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
  ActivityIndicator,
  Modal,
  TextInput,
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
import { coiffeurService } from '@/services/coiffeur.service';
import { BookingWithDetails } from '@/types';

export default function CoiffeurReservationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);

  // ... (rest of the state remains same)

  const saveWeeklySchedule = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      // ...
      setWeeklySchedule(unifiedSchedule);
      Alert.alert(t('common.success'), language === 'fr' ? 'Vos horaires ont été mis à jour et sont maintenant visibles par vos clients.' : 'Your hours have been updated and are now visible to your clients.');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert(t('common.error'), language === 'fr' ? 'Impossible d\'enregistrer les horaires.' : 'Unable to save hours.');
    } finally {
      setLoading(false);
    }
  };

  // ...

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t('booking.confirmed');
      case 'pending': return t('booking.pending');
      case 'completed': return t('booking.completed');
      case 'cancelled': return t('booking.cancelled');
      default: return '?';
    }
  };

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
              // ...
              fetchBookings();
              Alert.alert(t('common.success'), t('coiffeur.confirmSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), language === 'fr' ? 'Impossible de confirmer le rendez-vous.' : 'Unable to confirm appointment.');
            }
          },
        },
      ]
    );
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
      
      Alert.alert(
        t('coiffeur.cancelTitle'), 
        t('coiffeur.cancelSuccess')
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert(t('common.error'), language === 'fr' ? 'Impossible d\'annuler le rendez-vous.' : 'Unable to cancel appointment.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleBlockDay = async () => {
    if (isTodayBlocked) {
      Alert.alert('Info', language === 'fr' ? 'La journée est déjà bloquée.' : 'The day is already blocked.');
      return;
    }

    Alert.alert(
      language === 'fr' ? 'Urgences : Bloquer ma journée' : 'Emergency: Block my day',
      t('coiffeur.blockDayConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: language === 'fr' ? 'Oui, bloquer' : 'Yes, block', 
          style: 'destructive',
          onPress: async () => {
            try {
              // ...
              setIsTodayBlocked(true);
              Alert.alert(t('common.success'), t('coiffeur.blockSuccess'));
            } catch (error) {
              console.error('Error blocking day:', error);
              Alert.alert(t('common.error'), language === 'fr' ? 'Impossible de bloquer la journée.' : 'Unable to block the day.');
            }
          }
        }
      ]
    );
  };

  const handleUnblockDay = async () => {
    Alert.alert(
      t('coiffeur.unblockDay'),
      t('coiffeur.unblockDayConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: language === 'fr' ? 'Oui, débloquer' : 'Yes, unblock', 
          onPress: async () => {
            try {
              // ...
              setIsTodayBlocked(false);
              Alert.alert(t('common.success'), t('coiffeur.unblockSuccess'));
            } catch (error) {
              console.error('Error unblocking day:', error);
              Alert.alert(t('common.error'), language === 'fr' ? 'Impossible de débloquer la journée.' : 'Unable to unblock the day.');
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si pas connecté → écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="calendar" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>{t('booking.myReservations')}</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            {t('coiffeur.manageReservations')}
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/register', params: { role: 'coiffeur' } })}>
            <Text style={[styles.authLink, { color: colors.primary }]}>{t('coiffeur.createProAccount')}</Text>
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
            {t('coiffeur.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.primary : colors.textSecondary }]}>
            {t('coiffeur.pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('confirmed')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'confirmed' ? colors.primary : colors.textSecondary }]}>
            {t('coiffeur.confirmed')}
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
          {/* Bouton d'urgence - Toujours visible en haut des réservations */}
          <TouchableOpacity 
            style={[styles.pauseButton, { borderColor: isTodayBlocked ? colors.success : colors.error, marginTop: 0, marginBottom: 20 }]}
            onPress={isTodayBlocked ? handleUnblockDay : handleBlockDay}
          >
            <Ionicons 
              name={isTodayBlocked ? "checkmark-circle-outline" : "pause-circle-outline"} 
              size={20} 
              color={isTodayBlocked ? colors.success : colors.error} 
            />
            <Text style={[styles.pauseButtonText, { color: isTodayBlocked ? colors.success : colors.error }]}>
              {isTodayBlocked ? t('coiffeur.unblockDay') : t('coiffeur.blockDay')}
            </Text>
          </TouchableOpacity>

          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('coiffeur.noReservations')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t('coiffeur.reservationsAppear')}
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: colors.card }, Shadows.sm]}
              >
                {/* ... Header ... */}
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingDateTime}>
                    <Text style={[styles.bookingDate, { color: colors.text }]}>
                      {booking.booking_date}
                    </Text>
                    <Text style={[styles.bookingTime, { color: colors.primary }]}>
                      {booking.start_time.substring(0, 5)} - {booking.service?.duration_minutes}min
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
                        {booking.client?.full_name || booking.notes?.replace('Client: ', '') || t('profile.user')}
                      </Text>
                      <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
                        {booking.service?.name || 'Service'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={[styles.paymentInfo, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                      {t('coiffeur.paymentMethod')}
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.text }]}>
                      {booking.payment_method === 'deposit' ? t('checkout.depositOnly') : t('checkout.fullPayment')}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                      {t('coiffeur.paidOnline')}
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.success }]}>
                      {booking.amount_paid} EUR
                    </Text>
                  </View>
                  {(booking.remaining_amount || 0) > 0 && (
                    <View style={styles.paymentRow}>
                      <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                        {t('coiffeur.remainingAtSalon')}
                      </Text>
                      <Text style={[styles.paymentValue, { color: colors.accent }]}>
                        {booking.remaining_amount} EUR
                      </Text>
                    </View>
                  )}
                  <View style={[styles.paymentRow, styles.paymentTotal]}>
                    <Text style={[styles.paymentLabel, { color: colors.text, fontWeight: '600' }]}>
                      {t('coiffeur.total')}
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.primary, fontWeight: '700' }]}>
                      {booking.total_price} EUR
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <View style={styles.actions}>
                    {booking.status === 'pending' ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.success }]}
                          onPress={() => handleConfirm(booking.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>{t('coiffeur.confirm')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
                          onPress={() => openCancelModal(booking.id)}
                        >
                          <Ionicons name="close" size={20} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>{t('coiffeur.cancel')}</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Ionicons name="checkmark-done-circle" size={20} color={colors.success} />
                        <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>{t('coiffeur.validated')}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
                      onPress={() => router.push({
                        pathname: '/chat/[bookingId]',
                        params: { bookingId: booking.id },
                      })}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('coiffeur.message')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Modal d'annulation coiffeur */}
      <Modal
        visible={isCancelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('coiffeur.cancelTitle')}</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.warningBox, { backgroundColor: colors.error + '10' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                {t('coiffeur.cancelWarning')}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {t('coiffeur.cancelReasonLabel')}
            </Text>
            <TextInput
              style={[styles.reasonInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              placeholder={t('coiffeur.cancelReasonPlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              value={cancelReason}
              onChangeText={setCancelReason}
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <Button
                title={t('coiffeur.keepAppt')}
                variant="outline"
                onPress={() => setIsCancelModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={isSubmittingCancel ? t('common.loading') : t('coiffeur.confirmCancel')}
                onPress={handleCancelByCoiffeur}
                disabled={!cancelReason.trim() || isSubmittingCancel}
                style={{ flex: 1.5, backgroundColor: colors.error }}
                loading={isSubmittingCancel}
              />
            </View>
            <Text style={[styles.refundNote, { color: colors.textMuted }]}>
              {t('coiffeur.refundNote')}
            </Text>
          </View>
        </View>
      </Modal>
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

  /* Availability Styles */
  availabilityContainer: {
    paddingBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dayMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourInput: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  closedText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
    gap: 8,
  },
  pauseButtonText: {
    fontSize: 14,
    fontWeight: '700',
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

  /* Cancellation Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  refundNote: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
