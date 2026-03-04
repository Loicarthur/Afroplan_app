import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useStripe } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Shadows } from '@/constants/theme';
import { DEPOSIT_RATE, AFROPLAN_COMMISSION_RATE, paymentService } from '@/services/payment.service';
import { salonService } from '@/services/salon.service';
import { messageService } from '@/services/message.service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface BookingDetails {
  salonName: string;
  salonImage: string;
  serviceName: string;
  servicePrice: number;
  salonId: string;
  bookingId: string;
  date: string;
  time: string;
  duration: number;
}

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>((params.paymentType as 'deposit' | 'full') || 'deposit');

  const bookingDetails: BookingDetails = {
    salonName: params.salonName as string || 'Salon',
    salonImage: params.salonImage as string || 'https://via.placeholder.com/400',
    serviceName: params.serviceName as string || 'Service',
    servicePrice: parseInt(params.servicePrice as string) || 0,
    salonId: params.salonId as string || '',
    bookingId: params.bookingId as string || '',
    date: params.date as string || '',
    time: params.time as string || '',
    duration: parseInt(params.duration as string) || 60,
  };

  const depositAmount = Math.round(bookingDetails.servicePrice * DEPOSIT_RATE);
  const isFullPayment = paymentType === 'full';
  const payAmount = isFullPayment ? bookingDetails.servicePrice : depositAmount;
  const remainingAmount = isFullPayment ? 0 : bookingDetails.servicePrice - depositAmount;

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}`;
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
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

    setIsLoading(true);

    try {
      if (!bookingDetails.bookingId || bookingDetails.bookingId === 'undefined') {
        throw new Error(t('checkout.idMissing'));
      }

      if (isSupabaseConfigured()) {
        const response = await paymentService.createPaymentIntent(
          bookingDetails.bookingId,
          bookingDetails.servicePrice,
          bookingDetails.salonId,
          paymentType
        );
        
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: response.clientSecret,
          merchantDisplayName: 'AfroPlan',
          applePay: { merchantCountryCode: 'FR' },
          googlePay: { merchantCountryCode: 'FR', testEnv: true },
          appearance: {
            colors: {
              primary: colors.primary,
              background: colors.background,
              componentBackground: colors.card,
              componentBorder: colors.border,
              componentDivider: colors.border,
              primaryText: colors.text,
              secondaryText: colors.textSecondary,
              componentText: colors.text,
              placeholderText: colors.textMuted,
            },
            shapes: { borderRadius: 12 },
          },
        });

        if (initError) throw new Error(initError.message);

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === 'Canceled') {
            setIsLoading(false);
            return;
          }
          throw new Error(presentError.message);
        }

        try {
          const salon = await salonService.getSalonById(bookingDetails.salonId);
          if (salon && salon.owner_id) {
            const welcomeMsg = t('checkout.welcomeMsg')
              .replace('{date}', formatDate(bookingDetails.date))
              .replace('{time}', bookingDetails.time);
            
            await messageService.sendMessage(
              bookingDetails.bookingId,
              salon.owner_id,
              'coiffeur',
              welcomeMsg
            );
          }
        } catch (e) {}

        Alert.alert(
          t('checkout.paymentSuccess'),
          t('checkout.paymentSuccessDesc'),
          [{ text: t('checkout.viewBooking'), onPress: () => router.replace('/(tabs)/reservations') }]
        );
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        Alert.alert(t('checkout.paymentSuccess'), t('checkout.paymentSuccessDesc'));
      }
    } catch (error: any) {
      Alert.alert(t('checkout.paymentError'), error.message || t('checkout.paymentErrorDesc'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('checkout.title')}</Text>
        <View style={styles.secureIndicator}>
          <Ionicons name="lock-closed" size={14} color="#22C55E" />
          <Text style={styles.secureText}>{t('checkout.secure')}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.yourBooking')}</Text>
          <View style={styles.bookingInfo}>
            <Image source={{ uri: bookingDetails.salonImage }} style={styles.salonImage} contentFit="cover" />
            <View style={styles.bookingDetails}>
              <Text style={[styles.salonName, { color: colors.text }]}>{bookingDetails.salonName}</Text>
              <Text style={[styles.serviceName, { color: colors.primary }]}>{bookingDetails.serviceName}</Text>
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{formatDate(bookingDetails.date)}</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{bookingDetails.time} • {formatDuration(bookingDetails.duration)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.paymentTypeCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.choosePaymentType')}</Text>
          <TouchableOpacity
            style={[styles.paymentTypeOption, paymentType === 'deposit' && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
            onPress={() => setPaymentType('deposit')}
          >
            <View style={styles.paymentTypeLeft}>
              <Ionicons name="wallet-outline" size={22} color={paymentType === 'deposit' ? colors.primary : colors.textSecondary} />
              <View>
                <Text style={[styles.paymentTypeTitle, { color: colors.text }]}>{t('checkout.depositOnly')}</Text>
                <Text style={[styles.paymentTypeSubtitle, { color: colors.textSecondary }]}>20% = {formatAmount(depositAmount)}</Text>
              </View>
            </View>
            <View style={[styles.radioButton, paymentType === 'deposit' && { borderColor: colors.primary }]}>
              {paymentType === 'deposit' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentTypeOption, paymentType === 'full' && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
            onPress={() => setPaymentType('full')}
          >
            <View style={styles.paymentTypeLeft}>
              <Ionicons name="card-outline" size={22} color={paymentType === 'full' ? colors.primary : colors.textSecondary} />
              <View>
                <Text style={[styles.paymentTypeTitle, { color: colors.text }]}>{t('checkout.fullPayment')}</Text>
                <Text style={[styles.paymentTypeSubtitle, { color: colors.textSecondary }]}>{formatAmount(bookingDetails.servicePrice)}</Text>
              </View>
            </View>
            <View style={[styles.radioButton, paymentType === 'full' && { borderColor: colors.primary }]}>
              {paymentType === 'full' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.paymentMethodsCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.paymentMethod')}</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[styles.cardIcon, { backgroundColor: '#1A1A1A' }]}><Ionicons name="card" size={20} color="#FFFFFF" /></View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>{t('checkout.creditCard')}</Text>
                <Text style={[styles.paymentOptionSubtitle, { color: colors.textSecondary }]}>Visa, Mastercard, CB</Text>
              </View>
            </View>
            <View style={[styles.radioButton, paymentMethod === 'card' && { borderColor: colors.primary }]}>
              {paymentMethod === 'card' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.priceCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('checkout.priceDetail')}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('checkout.servicePrice')}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>{formatAmount(bookingDetails.servicePrice)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.depositLabel, { color: colors.primary }]}>{isFullPayment ? t('checkout.payFull') : t('checkout.depositNow')}</Text>
            <Text style={[styles.depositValue, { color: colors.primary }]}>{formatAmount(payAmount)}</Text>
          </View>
          {!isFullPayment && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('checkout.remainingAtSalon')}</Text>
              <Text style={[styles.priceValue, { color: colors.textSecondary }]}>{formatAmount(remainingAmount)}</Text>
            </View>
          )}
        </View>

        <View style={styles.termsContainer}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
          <Text style={[styles.termsText, { color: colors.textMuted }]}>{t('checkout.termsNotice')}</Text>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={isLoading}>
          <LinearGradient colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#191919', '#4A4A4A']} style={styles.payButtonGradient}>
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : (
              <>
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  {isFullPayment ? `${t('checkout.payFull')} ${formatAmount(payAmount)}` : `${t('checkout.payDeposit')} ${formatAmount(payAmount)}`}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  secureIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secureText: { fontSize: 12, color: '#22C55E', fontWeight: '500' },
  summaryCard: { margin: 20, padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  bookingInfo: { flexDirection: 'row', gap: 12 },
  salonImage: { width: 80, height: 80, borderRadius: 12 },
  bookingDetails: { flex: 1 },
  salonName: { fontSize: 16, fontWeight: '600' },
  serviceName: { fontSize: 14, fontWeight: '500', marginTop: 2, marginBottom: 8 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateTime: { fontSize: 13 },
  paymentTypeCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16 },
  paymentTypeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', marginBottom: 12 },
  paymentTypeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTypeTitle: { fontSize: 15, fontWeight: '600' },
  paymentTypeSubtitle: { fontSize: 12, marginTop: 2 },
  paymentMethodsCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', marginBottom: 12 },
  paymentOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  paymentOptionTitle: { fontSize: 15, fontWeight: '600' },
  paymentOptionSubtitle: { fontSize: 12 },
  radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioButtonInner: { width: 12, height: 12, borderRadius: 6 },
  priceCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginVertical: 12 },
  depositLabel: { fontSize: 15, fontWeight: '600' },
  depositValue: { fontSize: 18, fontWeight: '700' },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, gap: 8 },
  termsText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36 },
  payButton: { borderRadius: 12, overflow: 'hidden' },
  payButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
