/**
 * Page de Checkout - Afro'Planet
 * Paiement sécurisé pour les réservations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { paymentService, BOOKING_DEPOSIT } from '@/services/payment.service';

interface BookingDetails {
  salonName: string;
  salonImage: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  duration: number;
}

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile } = useAuth();
  const params = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');

  // Données de réservation (simulées - en réalité viendraient des params)
  const bookingDetails: BookingDetails = {
    salonName: params.salonName as string || 'Bella Coiffure',
    salonImage: params.salonImage as string || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    serviceName: params.serviceName as string || 'Box Braids',
    servicePrice: parseInt(params.servicePrice as string) || 12000, // en centimes
    date: params.date as string || '2026-02-05',
    time: params.time as string || '14:00',
    duration: parseInt(params.duration as string) || 180,
  };

  // Acompte fixe de 10€
  const depositAmount = BOOKING_DEPOSIT; // 1000 centimes = 10€
  const remainingAmount = bookingDetails.servicePrice - depositAmount;

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
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
    setIsLoading(true);

    try {
      // Simuler le processus de paiement
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // En production, on appellerait :
      // 1. paymentService.createPaymentIntent(bookingId, totalAmount, salonId)
      // 2. Stripe SDK pour confirmer le paiement
      // 3. paymentService.confirmPayment(paymentId, stripePaymentIntentId)

      Alert.alert(
        'Paiement réussi !',
        'Votre réservation est confirmée. Vous recevrez un email de confirmation.',
        [
          {
            text: 'Voir ma réservation',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur de paiement',
        'Une erreur est survenue. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Paiement
        </Text>
        <View style={styles.secureIndicator}>
          <Ionicons name="lock-closed" size={14} color="#22C55E" />
          <Text style={styles.secureText}>Sécurisé</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Résumé de la réservation */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Votre réservation
          </Text>

          <View style={styles.bookingInfo}>
            <Image
              source={{ uri: bookingDetails.salonImage }}
              style={styles.salonImage}
              contentFit="cover"
            />
            <View style={styles.bookingDetails}>
              <Text style={[styles.salonName, { color: colors.text }]}>
                {bookingDetails.salonName}
              </Text>
              <Text style={[styles.serviceName, { color: colors.primary }]}>
                {bookingDetails.serviceName}
              </Text>
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
                  {formatDate(bookingDetails.date)}
                </Text>
              </View>
              <View style={styles.dateTimeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
                  {bookingDetails.time} • {formatDuration(bookingDetails.duration)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Méthodes de paiement */}
        <View style={[styles.paymentMethodsCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Moyen de paiement
          </Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionSelected,
              paymentMethod === 'card' && { borderColor: colors.primary },
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[styles.cardIcon, { backgroundColor: '#1A1A1A' }]}>
                <Ionicons name="card" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                  Carte bancaire
                </Text>
                <Text style={[styles.paymentOptionSubtitle, { color: colors.textSecondary }]}>
                  Visa, Mastercard, CB
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === 'card' && { borderColor: colors.primary },
              ]}
            >
              {paymentMethod === 'card' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'apple' && styles.paymentOptionSelected,
              paymentMethod === 'apple' && { borderColor: colors.primary },
            ]}
            onPress={() => setPaymentMethod('apple')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[styles.cardIcon, { backgroundColor: '#1A1A1A' }]}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                  Apple Pay
                </Text>
                <Text style={[styles.paymentOptionSubtitle, { color: colors.textSecondary }]}>
                  Paiement rapide
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === 'apple' && { borderColor: colors.primary },
              ]}
            >
              {paymentMethod === 'apple' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'google' && styles.paymentOptionSelected,
              paymentMethod === 'google' && { borderColor: colors.primary },
            ]}
            onPress={() => setPaymentMethod('google')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[styles.cardIcon, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              </View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>
                  Google Pay
                </Text>
                <Text style={[styles.paymentOptionSubtitle, { color: colors.textSecondary }]}>
                  Paiement rapide
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioButton,
                paymentMethod === 'google' && { borderColor: colors.primary },
              ]}
            >
              {paymentMethod === 'google' && (
                <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Détail du prix */}
        <View style={[styles.priceCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Détail du prix
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Prix du service ({bookingDetails.serviceName})
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {formatAmount(bookingDetails.servicePrice)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.priceRow}>
            <View style={styles.priceLabelWithInfo}>
              <Text style={[styles.depositLabel, { color: colors.primary }]}>
                Acompte à payer maintenant
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Acompte de réservation',
                    'Cet acompte de 10€ confirme votre réservation et sera déduit du prix total. Le reste sera payé directement au salon le jour du rendez-vous.'
                  )
                }
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.depositValue, { color: colors.primary }]}>
              {formatAmount(depositAmount)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Reste à payer au salon
            </Text>
            <Text style={[styles.priceValue, { color: colors.textSecondary }]}>
              {formatAmount(remainingAmount)}
            </Text>
          </View>
        </View>

        {/* Info acompte */}
        <View style={[styles.depositInfoCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          <View style={styles.depositInfoContent}>
            <Text style={[styles.depositInfoTitle, { color: '#166534' }]}>
              Paiement sécurisé en 2 étapes
            </Text>
            <Text style={[styles.depositInfoText, { color: '#15803D' }]}>
              1. Payez 10€ d'acompte maintenant{'\n'}
              2. Réglez le reste ({formatAmount(remainingAmount)}) au salon
            </Text>
          </View>
        </View>

        {/* Conditions */}
        <View style={styles.termsContainer}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
          <Text style={[styles.termsText, { color: colors.textMuted }]}>
            Paiement sécurisé par Stripe. En payant, vous acceptez nos conditions d'utilisation et notre politique d'annulation.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bouton de paiement */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#7C3AED']}
            style={styles.payButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  Payer l'acompte de {formatAmount(depositAmount)}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  summaryCard: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  bookingInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  salonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  bookingDetails: {
    flex: 1,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateTime: {
    fontSize: 13,
  },
  paymentMethodsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  paymentOptionSelected: {
    backgroundColor: '#F3E8FF',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  depositLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  depositValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  depositInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  depositInfoContent: {
    flex: 1,
  },
  depositInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  depositInfoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    gap: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
