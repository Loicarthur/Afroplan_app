/**
 * Page Reservations Client - AfroPlan
 * Liste des rendez-vous du client avec statuts et acces au chat
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';
import { BookingWithDetails, Booking } from '@/types';

export default function ClientReservationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = React.useCallback(async () => {
    if (!user) return;
    try {
      const response = await bookingService.getClientBookings(user.id);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Mes reservations</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Connectez-vous pour voir vos rendez-vous
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.accent;
      case 'completed': return colors.textMuted;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirme';
      case 'pending': return 'En attente';
      case 'completed': return 'Termine';
      case 'cancelled': return 'Annule';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'completed': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const handleCancelBooking = (booking: BookingWithDetails) => {
    // Cas 1: Rendez-vous avec acompte (partiellement payé)
    if (booking.status === 'confirmed' && booking.payment_method === 'deposit') {
      Alert.alert(
        'Annulation impossible',
        'Ce rendez-vous a été validé par un acompte. Pour toute modification ou annulation, veuillez contacter directement le salon. L\'acompte n\'est pas remboursable via l\'application.'
      );
      return;
    }

    // Cas 2: Rendez-vous entièrement payé (Pénalité 20%)
    if (booking.status === 'confirmed' && booking.payment_method === 'full') {
      Alert.alert(
        'Annuler et rembourser ?',
        `Conformément à nos conditions, une pénalité de 20% s'applique pour toute annulation d'une prestation payée d'avance.\n\nMontant payé : ${booking.total_price}€\nFrais d'annulation (20%) : ${(booking.total_price * 0.2).toFixed(2)}€\nMontant qui vous sera remboursé : ${(booking.total_price * 0.8).toFixed(2)}€\n\nVoulez-vous continuer ?`,
        [
          { text: 'Conserver mon RDV', style: 'cancel' },
          { 
            text: 'Confirmer l\'annulation', 
            style: 'destructive', 
            onPress: () => {
              // Logique de remboursement partiel (Stripe) et annulation base de données
              Alert.alert('Succès', 'Votre rendez-vous a été annulé. Votre remboursement de 80% est en cours de traitement.');
            } 
          }
        ]
      );
      return;
    }

    // Cas 3: Rendez-vous en attente (Gratuit)
    if (booking.status === 'pending') {
      Alert.alert(
        'Annuler le rendez-vous',
        'Voulez-vous vraiment annuler ce rendez-vous ? Cette action est immédiate et gratuite car aucun paiement n\'a été effectué.',
        [
          { text: 'Non', style: 'cancel' },
          { 
            text: 'Oui, annuler', 
            style: 'destructive', 
            onPress: () => {
              // Logique d'annulation simple
              Alert.alert('Succès', 'Rendez-vous annulé.');
            } 
          }
        ]
      );
      return;
    }

    // Cas par défaut (Déjà terminé ou annulé)
    Alert.alert('Info', 'Ce rendez-vous ne peut plus être modifié.');
  };

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const displayedBookings = filter === 'upcoming' ? upcomingBookings : pastBookings;

  const renderBooking = ({ item }: { item: BookingWithDetails }) => (
    <View style={[styles.bookingCard, { backgroundColor: colors.card }, Shadows.sm]}>
      {/* Partie haute cliquable pour voir les détails (simulé) */}
      <TouchableOpacity 
        style={styles.bookingHeader}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/chat/[bookingId]',
          params: { bookingId: item.id },
        })}
      >
        <Image 
          source={{ uri: item.salon?.cover_image_url || item.salon?.image_url || 'https://via.placeholder.com/200' }} 
          style={styles.salonImage} 
          contentFit="cover" 
        />
        <View style={styles.bookingInfo}>
          <Text style={[styles.salonName, { color: colors.text }]} numberOfLines={1}>
            {item.salon?.name || 'Salon'}
          </Text>
          <Text style={[styles.serviceName, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.service?.name || 'Service'}
          </Text>
          <Text style={[styles.coiffeurName, { color: colors.textMuted }]}>
            {item.booking_date} à {item.start_time.substring(0, 5)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.bookingFooter, { borderTopColor: colors.border }]}>
        <View style={styles.dateTimeRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>{item.booking_date}</Text>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>{item.start_time.substring(0, 5)}</Text>
        </View>
        <Text style={[styles.priceText, { color: colors.primary }]}>{item.total_price} EUR</Text>
      </View>

      {(item.status === 'confirmed' || item.status === 'pending') && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push({
              pathname: '/chat/[bookingId]',
              params: { bookingId: item.id },
            })}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Message
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelBooking(item as any)}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes reservations</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'upcoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'upcoming' ? colors.primary : colors.textMuted },
          ]}>
            A venir ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'past' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setFilter('past')}
        >
          <Text style={[
            styles.filterTabText,
            { color: filter === 'past' ? colors.primary : colors.textMuted },
          ]}>
            Passees ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === 'upcoming' ? 'Aucun rendez-vous a venir' : 'Aucun rendez-vous passe'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Decouvrez nos salons et prenez rendez-vous !
          </Text>
          {filter === 'upcoming' && (
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreButtonText}>Explorer les salons</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  bookingCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bookingHeader: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  salonImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  salonName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  coiffeurName: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  priceText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
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
  actionButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  loginButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
