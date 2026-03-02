/**
 * Page Paiements Salon - AfroPlan
 * Historique des transactions et paiements groupés par jour
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { paymentService } from '@/services/payment.service';
import { salonService } from '@/services/salon.service';

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

export default function PaymentsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const fetchTransactions = async () => {
    if (!user?.id) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const response = await paymentService.getSalonPayments(salon.id);
        const mapped: Transaction[] = response.data.map((p: any) => ({
          id: p.id,
          clientName: p.booking?.client?.full_name || 'Client',
          serviceName: p.booking?.service?.name || 'Prestation',
          amount: p.amount / 100,
          commission: (p.commission || 0) / 100,
          net: (p.salon_amount || 0) / 100,
          date: p.created_at.split('T')[0],
          status: p.status === 'completed' ? 'completed' : p.status === 'failed' ? 'refunded' : 'pending',
        }));
        setTransactions(mapped);
        
        // Calculer le total du mois en cours
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const total = mapped
          .filter(tx => {
            const d = new Date(tx.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && tx.status === 'completed';
          })
          .reduce((sum, tx) => sum + tx.net, 0);
        setMonthlyTotal(total);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Groupement par jour de la semaine
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { date: string, dayName: string, items: Transaction[], dayTotal: number }> = {};
    
    const days = language === 'fr' 
      ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const dayName = days[d.getDay()];
      const key = tx.date;

      if (!groups[key]) {
        groups[key] = { date: tx.date, dayName, items: [], dayTotal: 0 };
      }
      groups[key].items.push(tx);
      if (tx.status === 'completed') {
        groups[key].dayTotal += tx.net;
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, language]);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return '#F59E0B';
      case 'refunded': return colors.error;
      default: return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{language === 'fr' ? 'Historique des gains' : 'Earnings History'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.content}
        >
          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: '#191919' }, Shadows.md]}>
            <Text style={styles.summaryLabel}>{language === 'fr' ? 'Revenus nets ce mois' : 'Net earnings this month'}</Text>
            <Text style={styles.summaryAmount}>{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</Text>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{transactions.filter(t => t.status === 'completed').length} {language === 'fr' ? 'ventes' : 'sales'}</Text>
            </View>
          </View>

          {/* Grouped Transactions */}
          {groupedTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{language === 'fr' ? 'Aucune transaction' : 'No transactions'}</Text>
            </View>
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayTitle, { color: colors.text }]}>{group.dayName} {new Date(group.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</Text>
                  <Text style={[styles.dayTotal, { color: colors.primary }]}>+{group.dayTotal.toFixed(2)} €</Text>
                </View>

                {group.items.map((tx) => (
                  <View key={tx.id} style={[styles.transactionCard, { backgroundColor: colors.card }, Shadows.sm]}>
                    <View style={styles.txMain}>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txClient, { color: colors.text }]}>{tx.clientName}</Text>
                        <Text style={[styles.txService, { color: colors.textSecondary }]}>{tx.serviceName}</Text>
                      </View>
                      <View style={styles.txAmountContainer}>
                        <Text style={[styles.txNet, { color: colors.success }]}>+{tx.net.toFixed(2)} €</Text>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(tx.status) }]} />
                      </View>
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={[styles.txDetailText, { color: colors.textMuted }]}>Brut: {tx.amount}€ · Frais: -{tx.commission}€</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  summaryCard: { padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
  summaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 },
  summaryAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  summaryBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  summaryBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  dayGroup: { marginBottom: 24 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  dayTotal: { fontSize: 14, fontWeight: '600' },
  transactionCard: { padding: 16, borderRadius: 16, marginBottom: 8 },
  txMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txInfo: { flex: 1 },
  txClient: { fontSize: 15, fontWeight: '600' },
  txService: { fontSize: 13, marginTop: 2 },
  txAmountContainer: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, alignItems: 'center' },
  txNet: { fontSize: 15, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  txDetails: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)' },
  txDetailText: { fontSize: 11 },
  emptyState: { alignItems: 'center', marginTop: 60 },
});
