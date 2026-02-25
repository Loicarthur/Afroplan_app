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

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'availability'>('all');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);

  // États pour le modal d'annulation
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isTodayBlocked, setIsTodayBlocked] = useState(false);

  // Vérifier si aujourd'hui est bloqué au chargement
  React.useEffect(() => {
    const checkBlocking = async () => {
      if (!user) return;
      try {
        const dateStr = new Date().toLocaleDateString('en-CA');
        const availabilities = await coiffeurService.getCoiffeurAvailabilities(user.id);
        const isBlocked = availabilities?.some(a => 
          a.specific_date === dateStr && 
          !a.is_available && 
          (a.start_time <= '00:00' || a.start_time === '00:00:00') && 
          (a.end_time >= '23:59' || a.end_time === '23:59:00' || a.end_time >= '23:59:59')
        );
        setIsTodayBlocked(!!isBlocked);
      } catch (e) {
        console.error('Error checking blocking:', e);
      }
    };
    if (isAuthenticated) checkBlocking();
  }, [user, isAuthenticated]);

  // État pour les horaires
  const [weeklySchedule, setWeeklySchedule] = useState<any>({
    monday: { active: true, start: '09:00', end: '18:00' },
    tuesday: { active: true, start: '09:00', end: '18:00' },
    wednesday: { active: true, start: '09:00', end: '18:00' },
    thursday: { active: true, start: '09:00', end: '18:00' },
    friday: { active: true, start: '09:00', end: '19:00' },
    saturday: { active: true, start: '10:00', end: '17:00' },
    sunday: { active: true, start: '09:00', end: '18:00' },
  });

  const [salonId, setSalonId] = useState<string | null>(null);

  const fetchBookings = React.useCallback(async () => {
    if (!user) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        setSalonId(salon.id);
        const response = await bookingService.getSalonBookings(salon.id);
        setBookings(response.data);
        
        // Charger les horaires du salon s'ils existent
        if (salon.opening_hours) {
          setWeeklySchedule(salon.opening_hours);
        }
      }
    } catch (error) {
      console.error('Error fetching salon bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const saveWeeklySchedule = async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // On prépare un format unifié pour les horaires
      const unifiedSchedule: any = {};
      Object.keys(weeklySchedule).forEach(day => {
        const dayConfig = weeklySchedule[day];
        unifiedSchedule[day] = {
          active: !!dayConfig.active,
          start: dayConfig.start || dayConfig.open || '09:00',
          end: dayConfig.end || dayConfig.close || '18:00',
          closed: !dayConfig.active,
          open: dayConfig.start || dayConfig.open || '09:00',
          close: dayConfig.end || dayConfig.close || '18:00',
        };
      });

      const { error } = await supabase
        .from('salons')
        .update({ opening_hours: unifiedSchedule })
        .eq('id', salonId);

      if (error) throw error;
      
      setWeeklySchedule(unifiedSchedule);
      Alert.alert('Succès', 'Vos horaires ont été mis à jour et sont maintenant visibles par vos clients.');
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les horaires.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    
    // Rafraîchir aussi le statut de blocage
    const checkBlocking = async () => {
      if (!user) return;
      try {
        const dateStr = new Date().toLocaleDateString('en-CA');
        const availabilities = await coiffeurService.getCoiffeurAvailabilities(user.id);
        const isBlocked = availabilities?.some(a => 
          a.specific_date === dateStr && 
          !a.is_available && 
          (a.start_time <= '00:00' || a.start_time === '00:00:00') && 
          (a.end_time >= '23:59' || a.end_time === '23:59:00' || a.end_time >= '23:59:59')
        );
        setIsTodayBlocked(!!isBlocked);
      } catch (e) {
        console.error('Error checking blocking on refresh:', e);
      }
    };
    checkBlocking();
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return booking.status !== 'cancelled';
    if (activeTab === 'pending') return booking.status === 'pending';
    if (activeTab === 'confirmed') return booking.status === 'confirmed';
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.accent;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirme';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Termine';
      case 'cancelled':
        return 'Annule';
      default:
        return 'Inconnu';
    }
  };

  const handleConfirm = async (bookingId: string) => {
    Alert.alert(
      'Confirmer la réservation',
      'Voulez-vous confirmer cette réservation et informer le client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await bookingService.confirmBooking(bookingId);
              fetchBookings();
              Alert.alert('Succès', 'Le rendez-vous a été confirmé.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de confirmer le rendez-vous.');
            }
          },
        },
      ]
    );
  };

  const openCancelModal = (bookingId: string) => {
    setSelectedBookingForCancel(bookingId);
    setCancelReason('');
    setIsCancelModalVisible(true);
  };

  const handleCancelByCoiffeur = async () => {
    if (!selectedBookingForCancel || !cancelReason.trim()) {
      Alert.alert('Attention', 'Veuillez saisir une raison valable pour l\'annulation.');
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
        'Rendez-vous annulé', 
        'Le client a été informé de la raison et le remboursement a été initié automatiquement.'
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Erreur', 'Impossible d\'annuler le rendez-vous.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleBlockDay = async () => {
    if (isTodayBlocked) {
      Alert.alert('Info', 'La journée est déjà bloquée.');
      return;
    }

    Alert.alert(
      'Urgences : Bloquer ma journée',
      'Êtes-vous sûr de vouloir fermer toutes vos réservations en ligne pour aujourd\'hui ? Plus aucun client ne pourra réserver de créneau.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui, bloquer', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              const salon = await salonService.getSalonByOwnerId(user.id);
              if (salon) {
                // Créer une plage d'indisponibilité totale pour aujourd'hui
                await coiffeurService.addAvailability({
                  coiffeur_id: user.id,
                  specific_date: new Date().toLocaleDateString('en-CA'),
                  day_of_week: new Date().getDay(),
                  start_time: '00:00',
                  end_time: '23:59',
                  is_available: false,
                  service_location: 'both'
                });
                
                setIsTodayBlocked(true);
                Alert.alert('Succès', 'Votre journée a été bloquée. Plus aucun rendez-vous ne pourra être pris en ligne pour aujourd\'hui.');
              }
            } catch (error) {
              console.error('Error blocking day:', error);
              Alert.alert('Erreur', 'Impossible de bloquer la journée.');
            }
          }
        }
      ]
    );
  };

  const handleUnblockDay = async () => {
    Alert.alert(
      'Débloquer ma journée',
      'Voulez-vous rouvrir vos réservations en ligne pour aujourd\'hui ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui, débloquer', 
          onPress: async () => {
            try {
              if (!user) return;
              const dateStr = new Date().toLocaleDateString('en-CA');
              
              await coiffeurService.deleteSpecificAvailability(user.id, dateStr);
              setIsTodayBlocked(false);
              Alert.alert('Succès', 'Vos réservations pour aujourd\'hui sont à nouveau ouvertes !');
            } catch (error) {
              console.error('Error unblocking day:', error);
              Alert.alert('Erreur', 'Impossible de débloquer la journée.');
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
            Confirmées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'availability' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('availability')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'availability' ? colors.primary : colors.textSecondary} 
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabText, { color: activeTab === 'availability' ? colors.primary : colors.textSecondary }]}>
            Dispo.
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
          {activeTab === 'availability' ? (
            <View style={styles.availabilityContainer}>
              <View style={[styles.infoBox, { backgroundColor: colors.primary + '08', borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Définissez vos horaires habituels pour que les clients sachent quand réserver.
                </Text>
              </View>

              {/* Liste ordonnée des jours en français */}
              {[
                { key: 'monday', label: 'Lundi' },
                { key: 'tuesday', label: 'Mardi' },
                { key: 'wednesday', label: 'Mercredi' },
                { key: 'thursday', label: 'Jeudi' },
                { key: 'friday', label: 'Vendredi' },
                { key: 'saturday', label: 'Samedi' },
                { key: 'sunday', label: 'Dimanche' },
              ].map(({ key, label }) => {
                const config = weeklySchedule[key] || { active: false, start: '09:00', end: '18:00' };
                return (
                  <View key={key} style={[styles.dayRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.dayMain}>
                      <TouchableOpacity 
                        style={[styles.checkbox, config.active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setWeeklySchedule((prev: any) => ({
                          ...prev,
                          [key]: { ...config, active: !config.active }
                        }))}
                      >
                        {config.active && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </TouchableOpacity>
                      <Text style={[styles.dayLabel, { color: config.active ? colors.text : colors.textMuted }]}>
                        {label}
                      </Text>
                    </View>

                    {config.active ? (
                      <View style={styles.hoursRow}>
                        <TextInput
                          style={[styles.hourInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                          value={config.start}
                          onChangeText={(val) => setWeeklySchedule((prev: any) => ({
                            ...prev,
                            [key]: { ...config, start: val }
                          }))}
                          maxLength={5}
                          placeholder="09:00"
                        />
                        <Text style={{ marginHorizontal: 8, color: colors.textMuted }}>-</Text>
                        <TextInput
                          style={[styles.hourInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                          value={config.end}
                          onChangeText={(val) => setWeeklySchedule((prev: any) => ({
                            ...prev,
                            [key]: { ...config, end: val }
                          }))}
                          maxLength={5}
                          placeholder="18:00"
                        />
                      </View>
                    ) : (
                      <Text style={[styles.closedText, { color: colors.textMuted }]}>Fermé</Text>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity 
                style={[styles.pauseButton, { borderColor: isTodayBlocked ? colors.success : colors.error }]}
                onPress={isTodayBlocked ? handleUnblockDay : handleBlockDay}
              >
                <Ionicons 
                  name={isTodayBlocked ? "checkmark-circle-outline" : "pause-circle-outline"} 
                  size={20} 
                  color={isTodayBlocked ? colors.success : colors.error} 
                />
                <Text style={[styles.pauseButtonText, { color: isTodayBlocked ? colors.success : colors.error }]}>
                  {isTodayBlocked ? "Débloquer ma journée" : "Bloquer ma journée (Urgence)"}
                </Text>
              </TouchableOpacity>

              <Button 
                title="Enregistrer mes horaires" 
                onPress={saveWeeklySchedule}
                style={{ marginTop: 24 }}
              />
            </View>
          ) : filteredBookings.length === 0 ? (
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
                        {booking.client?.full_name || booking.notes?.replace('Client: ', '') || 'Client'}
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
                      Mode de paiement
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.text }]}>
                      {booking.payment_method === 'deposit' ? 'Acompte' : 'Totalité'}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                      Payé en ligne
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.success }]}>
                      {booking.amount_paid} EUR
                    </Text>
                  </View>
                  {(booking.remaining_amount || 0) > 0 && (
                    <View style={styles.paymentRow}>
                      <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                        Reste à payer au salon
                      </Text>
                      <Text style={[styles.paymentValue, { color: colors.accent }]}>
                        {booking.remaining_amount} EUR
                      </Text>
                    </View>
                  )}
                  <View style={[styles.paymentRow, styles.paymentTotal]}>
                    <Text style={[styles.paymentLabel, { color: colors.text, fontWeight: '600' }]}>
                      Total
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
                          <Text style={styles.actionButtonText}>Confirmer</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
                          onPress={() => openCancelModal(booking.id)}
                        >
                          <Ionicons name="close" size={20} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>Annuler</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      /* Si déjà confirmé, on ne peut plus annuler, on ne peut que discuter */
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Ionicons name="checkmark-done-circle" size={20} color={colors.success} />
                        <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>Rendez-vous validé</Text>
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
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>Message</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>Annuler le rendez-vous</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.warningBox, { backgroundColor: colors.error + '10' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                Attention : Soyez bienveillant et professionnel dans votre explication. Votre réponse impacte directement l'image de votre salon.
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Raison de l'annulation (le client recevra ce message) :
            </Text>
            <TextInput
              style={[styles.reasonInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              placeholder="Ex: Urgence personnelle, fatigue excessive, pause imprévue..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              value={cancelReason}
              onChangeText={setCancelReason}
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <Button
                title="Conserver le rendez-vous"
                variant="outline"
                onPress={() => setIsCancelModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={isSubmittingCancel ? "Annulation..." : "Confirmer l'annulation"}
                onPress={handleCancelByCoiffeur}
                disabled={!cancelReason.trim() || isSubmittingCancel}
                style={{ flex: 1.5, backgroundColor: colors.error }}
                loading={isSubmittingCancel}
              />
            </View>
            <Text style={[styles.refundNote, { color: colors.textMuted }]}>
              * Le client sera remboursé automatiquement de la totalité du montant payé en ligne (hors frais Stripe).
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
