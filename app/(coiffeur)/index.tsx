/**
 * Dashboard Coiffeur AfroPlan
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  color: string;
  onPress?: () => void;
};

function StatCard({ icon, title, value, color, onPress }: StatCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function CoiffeurDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Stats mock (a remplacer par des donnees reelles)
  const [stats, setStats] = useState({
    todayBookings: 3,
    pendingBookings: 5,
    totalRevenue: 450,
    totalClients: 28,
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Verifier si l'utilisateur est un coiffeur
  if (!isAuthenticated || profile?.role !== 'coiffeur') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="cut-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Espace Coiffeur
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            Cet espace est reserve aux professionnels. Inscrivez-vous en tant que coiffeur pour acceder a votre dashboard.
          </Text>
          <Button
            title="S'inscrire en tant que coiffeur"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />
          <Button
            title="Se connecter"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.full_name || 'Coiffeur'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="calendar"
              title="Aujourd'hui"
              value={stats.todayBookings}
              color={colors.primary}
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
            <StatCard
              icon="time"
              title="En attente"
              value={stats.pendingBookings}
              color={colors.accent}
              onPress={() => router.push('/(coiffeur)/reservations')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="cash"
              title="Revenus (mois)"
              value={`${stats.totalRevenue} EUR`}
              color={colors.success}
            />
            <StatCard
              icon="people"
              title="Clients"
              value={stats.totalClients}
              color="#9B59B6"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/salon')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="storefront" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gerer mon salon
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/services')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="cut" size={24} color="#1A1A1A" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Gerer mes services
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => router.push('/(coiffeur)/reservations')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Voir les reservations
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Prochains rendez-vous
            </Text>
            <TouchableOpacity onPress={() => router.push('/(coiffeur)/reservations')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {/* Mock appointments */}
          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: colors.primary }]}>10:00</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>1h</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Marie Dupont</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Tresses africaines</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.appointmentStatusText, { color: colors.success }]}>Confirme</Text>
            </View>
          </View>

          <View style={[styles.appointmentCard, { backgroundColor: colors.card }]}>
            <View style={styles.appointmentTime}>
              <Text style={[styles.appointmentHour, { color: colors.primary }]}>14:30</Text>
              <Text style={[styles.appointmentDuration, { color: colors.textSecondary }]}>45min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={[styles.appointmentClient, { color: colors.text }]}>Jean Martin</Text>
              <Text style={[styles.appointmentService, { color: colors.textSecondary }]}>Coupe homme</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.appointmentStatusText, { color: colors.accent }]}>En attente</Text>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: FontSizes.md,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  quickActions: {
    gap: Spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  quickActionText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  appointmentTime: {
    alignItems: 'center',
    marginRight: Spacing.md,
    minWidth: 50,
  },
  appointmentHour: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  appointmentDuration: {
    fontSize: FontSizes.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  appointmentService: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  appointmentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  appointmentStatusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});
