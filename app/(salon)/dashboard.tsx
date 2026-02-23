/**
 * Dashboard Coiffeur/Salon - AfroPlan
 * Gestion des revenus, réservations et statistiques
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Shadows } from '@/constants/theme';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/services/payment.service';

const { width } = Dimensions.get('window');

interface PaymentStats {
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  transactionCount: number;
  averageTransaction: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  commission: number;
  salonAmount: number;
  status: string;
  createdAt: string;
  clientName?: string;
  serviceName?: string;
}

export default function SalonDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [balance, setBalance] = useState({ availableBalance: 0, currency: 'eur' });
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [, setIsStripeConnected] = useState(false);

  // Données de démonstration
  const mockStats: PaymentStats = {
    totalRevenue: 245000, // 2450€
    totalCommission: 36750, // 367.50€
    netRevenue: 208250, // 2082.50€
    transactionCount: 42,
    averageTransaction: 5833, // 58.33€
  };

  const mockRecentPayments: RecentPayment[] = [
    {
      id: '1',
      amount: 12000,
      commission: 1800,
      salonAmount: 10200,
      status: 'completed',
      createdAt: '2026-02-01T14:30:00',
      clientName: 'Marie D.',
      serviceName: 'Box Braids',
    },
    {
      id: '2',
      amount: 8500,
      commission: 1275,
      salonAmount: 7225,
      status: 'completed',
      createdAt: '2026-02-01T10:00:00',
      clientName: 'Aminata K.',
      serviceName: 'Twists',
    },
    {
      id: '3',
      amount: 6000,
      commission: 900,
      salonAmount: 5100,
      status: 'pending',
      createdAt: '2026-01-31T16:45:00',
      clientName: 'Sophie L.',
      serviceName: 'Coupe naturelle',
    },
  ];

  const loadDashboardData = async () => {
    // Pour le moment, utiliser les données de démo
    setStats(mockStats);
    setBalance({ availableBalance: 52350, currency: 'eur' });
    setRecentPayments(mockRecentPayments);
    setCurrentPlan('free');
    setIsStripeConnected(true);
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  const handleUpgradePlan = () => {
    router.push('/(salon)/subscription');
  };

  const handleViewPayments = () => {
    router.push('/(salon)/payments' as any);
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Retrait',
      `Voulez-vous transférer ${formatAmount(balance.availableBalance)} vers votre compte bancaire ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => Alert.alert('Succès', 'Le virement sera effectué sous 2-3 jours ouvrés.'),
        },
      ]
    );
  };

  const currentPlanInfo = SUBSCRIPTION_PLANS[currentPlan];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.salonName}>{profile?.full_name || 'Mon Salon'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Plan actuel */}
        <TouchableOpacity
          style={styles.planBadge}
          onPress={handleUpgradePlan}
        >
          <View style={styles.planInfo}>
            <Text style={styles.planLabel}>Plan actuel</Text>
            <Text style={styles.planName}>{currentPlanInfo.name}</Text>
          </View>
          <View style={styles.planCommission}>
            <Text style={styles.commissionRate}>{currentPlanInfo.commission}%</Text>
            <Text style={styles.commissionLabel}>commission</Text>
          </View>
          {currentPlan !== 'premium' && (
            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeText}>Améliorer</Text>
              <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Solde disponible */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card }, Shadows.lg]}>
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Solde disponible
          </Text>
          <TouchableOpacity onPress={handleWithdraw}>
            <Text style={[styles.withdrawLink, { color: colors.primary }]}>
              Retirer →
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          {formatAmount(balance.availableBalance)}
        </Text>
        <Text style={[styles.balanceNote, { color: colors.textMuted }]}>
          Prochain virement automatique : Vendredi
        </Text>
      </View>

      {/* Sélecteur de période */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && { backgroundColor: colors.primary },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodText,
                { color: period === p ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {p === 'week' ? '7 jours' : p === 'month' ? '30 jours' : '1 an'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistiques */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats ? formatAmount(stats.totalRevenue) : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Chiffre d&apos;affaires
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="trending-up-outline" size={24} color="#22C55E" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats ? formatAmount(stats.netRevenue) : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Net perçu
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="receipt-outline" size={24} color="#F97316" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.transactionCount || '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Réservations
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Ionicons name="calculator-outline" size={24} color="#3B82F6" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats ? formatAmount(stats.averageTransaction) : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Panier moyen
          </Text>
        </View>
      </View>

      {/* Commission payée */}
      <View style={[styles.commissionCard, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="information-circle" size={20} color="#D97706" />
        <View style={styles.commissionInfo}>
          <Text style={[styles.commissionTitle, { color: '#92400E' }]}>
            Commission ce mois
          </Text>
          <Text style={[styles.commissionAmount, { color: '#D97706' }]}>
            {stats ? formatAmount(stats.totalCommission) : '--'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleUpgradePlan}>
          <Text style={[styles.reduceLink, { color: '#D97706' }]}>
            Réduire →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Paiements récents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Paiements récents
          </Text>
          <TouchableOpacity onPress={handleViewPayments}>
            <Text style={[styles.viewAllLink, { color: colors.primary }]}>
              Voir tout →
            </Text>
          </TouchableOpacity>
        </View>

        {recentPayments.map((payment) => (
          <View
            key={payment.id}
            style={[styles.paymentItem, { backgroundColor: colors.card }, Shadows.sm]}
          >
            <View style={styles.paymentLeft}>
              <Text style={[styles.paymentService, { color: colors.text }]}>
                {payment.serviceName}
              </Text>
              <Text style={[styles.paymentClient, { color: colors.textSecondary }]}>
                {payment.clientName}
              </Text>
              <Text style={[styles.paymentDate, { color: colors.textMuted }]}>
                {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={[styles.paymentAmount, { color: colors.text }]}>
                +{formatAmount(payment.salonAmount)}
              </Text>
              <View
                style={[
                  styles.paymentStatus,
                  {
                    backgroundColor:
                      payment.status === 'completed' ? '#DCFCE7' : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={{
                    color: payment.status === 'completed' ? '#166534' : '#92400E',
                    fontSize: 10,
                    fontWeight: '600',
                  }}
                >
                  {payment.status === 'completed' ? 'Reçu' : 'En attente'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Actions rapides
        </Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => router.push('/(salon)/reservations' as any)}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Réservations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => router.push('/(salon)/services' as any)}
          >
            <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Services
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={() => router.push('/(salon)/reviews' as any)}
          >
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Avis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }, Shadows.sm]}
            onPress={handleUpgradePlan}
          >
            <Ionicons name="diamond-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Abonnement
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  salonName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planCommission: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  commissionRate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commissionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  balanceCard: {
    margin: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
  },
  withdrawLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceNote: {
    fontSize: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  commissionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  reduceLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentService: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentClient: {
    fontSize: 13,
    marginTop: 2,
  },
  paymentDate: {
    fontSize: 11,
    marginTop: 4,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
