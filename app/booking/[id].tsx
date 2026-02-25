/**
 * Page de reservation avec options de paiement AfroPlan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalon } from '@/hooks/use-salons';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';
import { PaymentMethod, DEPOSIT_AMOUNT } from '@/types/database';

type TimeSlot = {
  start: string;
  end: string;
};

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    id: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: string;
    requiresExtensions: string;
    extensionsIncluded: string;
  }>();

  const { 
    id, 
    serviceName, 
    servicePrice, 
    serviceDuration,
    requiresExtensions,
    extensionsIncluded
  } = params;

  const isRequiresExtensions = requiresExtensions === 'true';
  const isExtensionsIncluded = extensionsIncluded === 'true';

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { salon, isLoading: loadingSalon } = useSalon(id || '');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('deposit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const price = parseFloat(servicePrice || '0');
  const duration = parseInt(serviceDuration || '60', 10);

  // Calculer les montants selon le mode de paiement
  const getPaymentDetails = () => {
    switch (paymentMethod) {
      case 'full':
        return {
          amountNow: price,
          amountLater: 0,
          label: t('checkout.fullPayment'),
          description: t('checkout.payFull'),
        };
      case 'deposit':
      default:
        return {
          amountNow: DEPOSIT_AMOUNT,
          amountLater: price - DEPOSIT_AMOUNT,
          label: t('checkout.depositOnly'),
          description: t('checkout.depositInfo'),
        };
    }
  };

  const paymentDetails = getPaymentDetails();

  // Generer les dates disponibles (7 prochains jours)
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Generer les creneaux horaires disponibles
  const getAvailableSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    // 1. Récupérer les horaires du salon pour le jour sélectionné
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDayName = days[selectedDate.getDay()];
    const schedule = salon?.opening_hours ? (salon.opening_hours as any)[selectedDayName] : null;

    // Si pas d'horaires définis ou salon fermé ce jour-là
    if (!schedule || schedule.closed) {
      return [];
    }

    // 2. Parser les horaires (format HH:mm)
    const [startH, startM] = schedule.open.split(':').map(Number);
    const [endH, endM] = schedule.close.split(':').map(Number);

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    for (let hour = startH; hour <= endH; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Ignorer si on commence avant l'heure d'ouverture exacte
        if (hour === startH && minute < startM) continue;
        
        // Calculer l'heure de fin du créneau
        const slotEndMinutes = hour * 60 + minute + duration;
        const closingMinutes = endH * 60 + endM;

        // Ignorer si on finit après l'heure de fermeture
        if (slotEndMinutes > closingMinutes) continue;

        // Vérifier si le créneau est dans le passé pour aujourd'hui
        if (isToday) {
          const slotDate = new Date(now);
          slotDate.setHours(hour, minute, 0, 0);
          
          const limitDate = new Date(now);
          limitDate.setMinutes(now.getMinutes() + 30); // Marge 30 min

          if (slotDate < limitDate) continue;
        }

        const startStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHourCalc = Math.floor(slotEndMinutes / 60);
        const endMinCalc = slotEndMinutes % 60;
        const endStr = `${endHourCalc.toString().padStart(2, '0')}:${endMinCalc.toString().padStart(2, '0')}`;

        slots.push({ start: startStr, end: endStr });
      }
    }
    return slots;
  };

  const timeSlots = getAvailableSlots();

  const formatDate = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleConfirmBooking = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (!selectedSlot) {
      Alert.alert(t('common.error'), 'Veuillez selectionner un creneau horaire');
      return;
    }

    setIsSubmitting(true);

    try {
      const { supabase } = await import('@/lib/supabase');
      const todayStr = selectedDate.toISOString().split('T')[0];
      const startDateTime = `${selectedSlot.start}:00`;
      const endDateTime = `${selectedSlot.end}:00`;

      if (!params.serviceId) {
        throw new Error('Informations du service manquantes');
      }

      // Pour la DB, on prend le premier ID de service si plusieurs sont présents
      const firstServiceId = params.serviceId.includes(',') 
        ? params.serviceId.split(',')[0] 
        : params.serviceId;
      
      // On prépare une note avec tous les services sélectionnés
      const bookingNotes = params.serviceId.includes(',') 
        ? `Prestations sélectionnées: ${serviceName}`
        : null;

      // 1. Créer la réservation initiale (statut pending)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          salon_id: id,
          service_id: firstServiceId,
          client_id: user.id,
          booking_date: todayStr,
          start_time: startDateTime,
          end_time: endDateTime,
          total_price: price,
          status: 'pending',
          payment_method: paymentMethod,
          service_location: 'salon',
          notes: bookingNotes,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Erreur SQL creation reservation:', bookingError);
        throw bookingError;
      }

      if (!booking || !booking.id) {
        throw new Error('La réservation a été créée mais aucun identifiant n\'a été retourné.');
      }

      console.log('DEBUG: Réservation créée avec succès:', booking.id);

      // 2. Rediriger vers la page de checkout réelle
      router.push({
        pathname: '/checkout',
        params: {
          bookingId: booking.id,
          salonId: id,
          salonName: salon?.name || '',
          salonImage: salon?.image_url || '',
          serviceName: serviceName || '',
          servicePrice: (price * 100).toString(), // En centimes pour le checkout
          duration: duration.toString(),
          paymentType: paymentMethod, // 'deposit' or 'full'
          date: todayStr,
          time: selectedSlot.start,
        }
      });

    } catch (error: any) {
      console.error('Booking Error:', error);
      Alert.alert(t('common.error'), error.message || t('common.errorOccurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSuccessAlert = (bookingId: string) => {
    Alert.alert(
      t('checkout.paymentSuccess'),
      `${t('checkout.paymentSuccessDesc')}\n\nDate: ${formatDate(selectedDate).day} ${formatDate(selectedDate).date} ${formatDate(selectedDate).month}\nHeure: ${selectedSlot?.start}\nService: ${serviceName}\n\nMontant payé: ${paymentDetails.amountNow} EUR\n\nVous pouvez désormais échanger avec votre coiffeur.`,
      [
        {
          text: 'Envoyer un message',
          onPress: () => router.replace(`/chat/${bookingId}`),
        },
        {
          text: t('booking.yourBookings'),
          onPress: () => router.replace('/(tabs)/reservations'),
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>
            {t('auth.loginRequired')}
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            {t('auth.loginRequiredMessage')}
          </Text>
          <Button
            title={t('auth.login')}
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
          <Button
            title={t('auth.register')}
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadingSalon) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Service selectionne */}
        <View style={[styles.section, styles.serviceSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {params.serviceId?.includes(',') 
              ? (language === 'fr' ? 'Prestations sélectionnées' : 'Selected Services')
              : (language === 'fr' ? 'Service sélectionné' : 'Selected Service')}
          </Text>
          <View style={styles.serviceInfo}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.serviceName, { color: colors.text }]}>
                {serviceName || 'Service'}
              </Text>
              <Text style={[styles.serviceDuration, { color: colors.textSecondary }]}>
                {duration} min
              </Text>
            </View>
            <Text style={[styles.servicePrice, { color: colors.primary }]}>
              {price} EUR
            </Text>
          </View>

          {isRequiresExtensions && (
            <View style={[styles.extensionNote, { backgroundColor: isExtensionsIncluded ? '#F0FDF4' : '#FFFBEB' }]}>
              <Ionicons 
                name={isExtensionsIncluded ? 'checkmark-circle' : 'alert-circle'} 
                size={18} 
                color={isExtensionsIncluded ? '#22C55E' : '#D97706'} 
              />
              <Text style={[styles.extensionNoteText, { color: isExtensionsIncluded ? '#166534' : '#92400E' }]}>
                {isExtensionsIncluded 
                  ? t('service.extensionsNoteIncluded')
                  : t('service.extensionsNoteNotIncluded')}
              </Text>
            </View>
          )}
        </View>

        {/* Selection de la date */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Choisir une date' : 'Choose a date'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesContainer}>
              {availableDates.map((date, index) => {
                const formatted = formatDate(date);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCard,
                      { backgroundColor: colors.card },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {formatted.day}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {formatted.date}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {formatted.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Selection de l'heure */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Choisir un créneau' : 'Choose a time slot'}
          </Text>
          <View style={styles.slotsGrid}>
            {timeSlots.map((slot, index) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.slotCard,
                    { backgroundColor: colors.card },
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotTime,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {slot.start}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Options de paiement */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('checkout.paymentMethod')}
          </Text>

          {/* Option: Paiement integral */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { backgroundColor: colors.card, borderColor: colors.border },
              paymentMethod === 'full' && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setPaymentMethod('full')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={[
                styles.radioButton,
                { borderColor: paymentMethod === 'full' ? colors.primary : colors.border },
              ]}>
                {paymentMethod === 'full' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                  {t('checkout.fullPayment')}
                </Text>
                <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>
                  {t('checkout.payFull')}
                </Text>
              </View>
              <Text style={[styles.paymentOptionAmount, { color: colors.primary }]}>
                {price} EUR
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option: Acompte */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              { backgroundColor: colors.card, borderColor: colors.border },
              paymentMethod === 'deposit' && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setPaymentMethod('deposit')}
          >
            <View style={styles.paymentOptionHeader}>
              <View style={[
                styles.radioButton,
                { borderColor: paymentMethod === 'deposit' ? colors.primary : colors.border },
              ]}>
                {paymentMethod === 'deposit' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                  {t('checkout.depositOnly')} ({DEPOSIT_AMOUNT} EUR)
                </Text>
                <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>
                  Payez {DEPOSIT_AMOUNT} EUR maintenant, le reste ({price - DEPOSIT_AMOUNT} EUR) au salon
                </Text>
              </View>
              <Text style={[styles.paymentOptionAmount, { color: colors.primary }]}>
                {DEPOSIT_AMOUNT} EUR
              </Text>
            </View>
            <View style={[styles.recommendedBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="star" size={12} color="#1A1A1A" />
              <Text style={styles.recommendedText}>Recommande</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Resume */}
        <View style={[styles.section, styles.summarySection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'fr' ? 'Résumé' : 'Summary'}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Service
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {serviceName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Date
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatDate(selectedDate).day} {formatDate(selectedDate).date} {formatDate(selectedDate).month}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Heure
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {selectedSlot ? selectedSlot.start : 'Non selectionne'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Prix total
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {price} EUR
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              A payer maintenant
            </Text>
            <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>
              {paymentDetails.amountNow} EUR
            </Text>
          </View>
          {paymentDetails.amountLater > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Reste a payer au salon
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {paymentDetails.amountLater} EUR
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton de confirmation */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <Button
          title={isSubmitting ? 'Confirmation...' : `${t('common.confirm')} - ${paymentDetails.amountNow} EUR`}
          onPress={handleConfirmBooking}
          disabled={!selectedSlot || isSubmitting}
          fullWidth
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  serviceSection: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceDuration: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  servicePrice: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  extensionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  extensionNoteText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dateCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 70,
  },
  dateDay: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  dateNumber: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginVertical: Spacing.xs,
  },
  dateMonth: {
    fontSize: FontSizes.sm,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotCard: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  slotTime: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  paymentOption: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  paymentOptionDesc: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  paymentOptionAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderBottomLeftRadius: BorderRadius.md,
    gap: 4,
  },
  recommendedText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summarySection: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  summaryValueHighlight: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
