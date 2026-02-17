/**
 * Page Paiements Salon - AfroPlan
 * Historique des transactions et paiements
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

interface Transaction {
  id: string;
  clientName: string;
  serviceName: string;
  amount: number;
  commission: number;
  net: number;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    clientName: 'Marie Dupont',
    serviceName: 'Tresses africaines',
    amount: 65,
    commission: 9.75,
    net: 55.25,
    date: '2025-01-15',
    status: 'completed',
  },
  {
    id: '2',
    clientName: 'Fatou Diallo',
    serviceName: 'Locks entretien',
    amount: 45,
    commission: 6.75,
    net: 38.25,
    date: '2025-01-14',
    status: 'completed',
  },
  {
    id: '3',
    clientName: 'Aminata Bamba',
    serviceName: 'Coupe + Coloration',
    amount: 80,
    commission: 12,
    net: 68,
    date: '2025-01-13',
    status: 'pending',
  },
];

export default function PaymentsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.accent;
      case 'refunded': return colors.error;
    }
  };

  const getStatusLabel = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'Termine';
      case 'pending': return 'En attente';
      case 'refunded': return 'Rembourse';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paiements</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Revenus ce mois
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>161,50 EUR</Text>
          <Text style={[styles.summarySubtext, { color: colors.textMuted }]}>
            3 transactions
          </Text>
        </View>

        {/* Transactions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions recentes</Text>

        {MOCK_TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={[styles.transactionCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.transactionHeader}>
              <View>
                <Text style={[styles.transactionClient, { color: colors.text }]}>
                  {tx.clientName}
                </Text>
                <Text style={[styles.transactionService, { color: colors.textSecondary }]}>
                  {tx.serviceName}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                  {getStatusLabel(tx.status)}
                </Text>
              </View>
            </View>
            <View style={styles.transactionDetails}>
              <View style={styles.transactionRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Montant</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{tx.amount} EUR</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Commission</Text>
                <Text style={[styles.detailValue, { color: colors.error }]}>-{tx.commission} EUR</Text>
              </View>
              <View style={[styles.transactionRow, styles.netRow]}>
                <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '600' }]}>Net</Text>
                <Text style={[styles.detailValue, { color: colors.success, fontWeight: '700' }]}>{tx.net} EUR</Text>
              </View>
            </View>
            <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{tx.date}</Text>
          </View>
        ))}
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
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  summarySubtext: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  transactionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionClient: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  transactionService: {
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
  transactionDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
  },
});
