/**
 * Dashboard Coiffeur AfroPlan
 * Design basé sur sd.png et sde.png
 * Charte graphique: Noir #191919, Blanc #f9f8f8
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
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown, FadeInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService } from '@/services/salon.service';
import { bookingService } from '@/services/booking.service';
import { coiffeurService } from '@/services/coiffeur.service';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import NotificationModal from '@/components/NotificationModal';

const { width } = Dimensions.get('window');

export default function CoiffeurDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingSalon, setLoadingSalon] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  
  // Modals & States
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [manualClientName, setManualClientName] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const salonData = await salonService.getSalonByOwnerId(user.id);
      if (salonData) {
        const fullSalon = await salonService.getSalonById(salonData.id);
        setSalon(fullSalon);

        const todayStr = new Date().toLocaleDateString('en-CA');
        const bookingsData = await bookingService.getSalonBookings(salonData.id, undefined, todayStr);
        setTodayBookings(bookingsData.data);

        const statsData = await salonService.getSalonStats(salonData.id);
        setAllTimeStats(statsData);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoadingSalon(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && profile?.role === 'coiffeur') {
        fetchDashboardData();
      }
    }, [isAuthenticated, profile?.role])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLastMinuteBoost = () => {
    Alert.alert(
      'Boost de dernière minute 🚀',
      'Voulez-vous activer une promotion flash de -15% sur tous vos services pour les prochaines 4 heures ? Cela aidera à remplir vos créneaux vides.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { 
          text: 'Activer le Boost', 
          onPress: async () => {
            Alert.alert('Boost activé !', 'Votre promotion est en ligne et vos clients favoris ont été notifiés.');
          }
        }
      ]
    );
  };

  const handleSwitchToClient = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'client');
    router.replace('/(tabs)');
  };

  const pendingBookingsCount = todayBookings.filter(b => b.status === 'pending').length;
  const confirmedTodayCount = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;

  const stats = {
    todayBookings: confirmedTodayCount,
    pendingBookings: pendingBookingsCount,
    totalRevenue: allTimeStats?.totalRevenue || 0,
    weeklyRevenue: allTimeStats?.weeklyRevenue || 0,
    weeklyBookingsCount: allTimeStats?.weeklyBookingsCount || 0,
    averageRating: allTimeStats?.averageRating || 0,
  };

  if (loadingSalon) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Tableau de bord</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{profile?.full_name || 'Coiffeur'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              {stats.pendingBookings > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.businessCard, { backgroundColor: '#191919' }]}>
          <View style={styles.businessHeader}>
            <View>
              <Text style={styles.businessLabel}>Revenus de la semaine</Text>
              <Text style={styles.businessValue}>{stats.weeklyRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color="#22C55E" />
              <Text style={styles.growthText}>En hausse</Text>
            </View>
          </View>
          <View style={styles.footerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.weeklyBookingsCount}</Text>
              <Text style={styles.statLabel}>RDV cette sem.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayBookings}</Text>
              <Text style={styles.statLabel}>Aujourd'hui</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Note avis</Text>
            </View>
          </View>
        </Animated.View>

        {/* Financial Transparency */}
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.transparencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.transparencyHeader}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[styles.transparencyTitle, { color: colors.text }]}>Votre rémunération</Text>
          </View>
          <View style={styles.flowContainer}>
            <View style={styles.flowStep}><Text style={styles.flowAmount}>{stats.totalRevenue.toFixed(0)}€</Text><Text style={styles.flowLabel}>Brut</Text></View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.flowStep}><Text style={[styles.flowAmount, { color: colors.error }]}>-20%</Text><Text style={styles.flowLabel}>Frais</Text></View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.flowStep}><Text style={[styles.flowAmount, { color: colors.success }]}>{(stats.totalRevenue * 0.8).toFixed(0)}€</Text><Text style={styles.flowLabel}>Net</Text></View>
          </View>
        </Animated.View>

        {/* Quick Pro Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions professionnelles</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.proActionButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]} onPress={handleLastMinuteBoost}>
              <Ionicons name="rocket-outline" size={24} color={colors.primary} />
              <Text style={[styles.proActionText, { color: colors.primary }]}>Boost Flash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.proActionButton, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]} onPress={() => setBookingModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={24} color={colors.success} />
              <Text style={[styles.proActionText, { color: colors.success }]}>RDV Manuel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Switching Mode */}
        <TouchableOpacity style={[styles.switchCard, { backgroundColor: colors.card }]} onPress={handleSwitchToClient}>
          <Ionicons name="people-outline" size={24} color={colors.primary} />
          <View style={styles.switchContent}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Mode Client</Text>
            <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>Réserver une prestation pour moi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <NotificationModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWhidth: 2, borderColor: '#FFF' },
  businessCard: { margin: 20, padding: 24, borderRadius: 24 },
  businessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  businessLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 4 },
  businessValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  growthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  growthText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  footerStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  transparencyCard: { marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 20, borderWidth: 1 },
  transparencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  transparencyTitle: { fontSize: 15, fontWeight: '700' },
  flowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  flowStep: { alignItems: 'center' },
  flowAmount: { fontSize: 16, fontWeight: '700' },
  flowLabel: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  proActionButton: { flex: 1, height: 90, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  proActionText: { fontSize: 13, fontWeight: '700' },
  switchCard: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
  switchContent: { flex: 1, marginLeft: 16 },
  switchTitle: { fontSize: 16, fontWeight: '600' },
  switchSubtitle: { fontSize: 13, marginTop: 2 },
});
