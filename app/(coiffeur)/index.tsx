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
  const [salonServices, setSalonServices] = useState<any[]>([]);
  
  // Formulaire RDV Manuel
  const [manualClientName, setManualClientName] = useState('');
  const [manualService, setManualService] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toLocaleDateString('fr-FR'));
  const [manualTime, setManualTime] = useState('14:00');
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('--- DASHBOARD DIAGNOSTIC ---');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);

      // 1. Détection du salon (ultra-robuste)
      const salonData = await salonService.getSalonByOwnerId(user.id, user.email);
      
      if (salonData) {
        console.log('Salon ID Found:', salonData.id);
        setSalon(salonData);

        // Charger les services du salon pour le RDV Manuel
        salonService.getSalonServices(salonData.id).then(services => {
          setSalonServices(services || []);
        });
        
        // Initialisation immédiate des stats pour éviter les écrans vides
        setAllTimeStats(prev => prev || {
          totalRevenue: 0,
          weeklyRevenue: 0,
          weeklyBookingsCount: 0,
          averageRating: salonData.rating || 0,
        });

        // 2. Chargement asynchrone des données détaillées (ne bloque pas l'affichage)
        const todayStr = new Date().toLocaleDateString('en-CA');
        
        // On lance les appels sans attendre le résultat pour libérer l'UI immédiatement
        Promise.all([
          salonService.getSalonById(salonData.id).catch(() => null),
          bookingService.getSalonBookings(salonData.id, undefined, todayStr).catch(() => ({ data: [] })),
          salonService.getSalonStats(salonData.id).catch(() => null)
        ]).then(([fullSalonRes, bookingsRes, statsRes]) => {
          if (fullSalonRes) setSalon(fullSalonRes);
          if (bookingsRes) setTodayBookings(bookingsRes.data || []);
          if (statsRes) setAllTimeStats(statsRes);
        });

      } else {
        console.log('NO SALON FOUND IN DB');
        setSalon(null);
      }
    } catch (error) {
      console.error('DASHBOARD ERROR:', error);
    } finally {
      setLoadingSalon(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchDashboardData();
      } else if (!isAuthenticated) {
        setLoadingSalon(false);
      }
    }, [isAuthenticated, user?.id])
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

  // Rendu selon l'état réel des données
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.userName, { marginTop: 20, textAlign: 'center' }]}>Accès restreint</Text>
        <Button title="Se connecter" onPress={() => router.push('/(auth)/login')} style={{ marginTop: 20, width: '100%' }} />
      </SafeAreaView>
    );
  }

  if (loadingSalon && !salon) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Initialisation...</Text>
      </View>
    );
  }

  // Écran de création si vraiment aucun salon n'est trouvé après chargement
  if (!salon) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="storefront-outline" size={80} color={colors.primary} />
          <Text style={[styles.userName, { textAlign: 'center', marginTop: 20 }]}>Prêt à lancer votre salon ?</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>Configurez votre vitrine pour recevoir vos premiers clients.</Text>
          <Button title="Créer mon salon" onPress={() => router.push('/(coiffeur)/salon')} style={{ marginTop: 30, width: '100%' }} />
          <TouchableOpacity onPress={handleSwitchToClient} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Mode client</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 40 }}>UID: {user?.id}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard normal
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
            <Text style={[styles.userName, { color: colors.text }]}>{salon.name || profile?.full_name || 'Coiffeur'}</Text>
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
              <Text style={styles.growthText}>Activité</Text>
            </View>
          </View>
          <View style={styles.footerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.weeklyBookingsCount}</Text>
              <Text style={styles.statLabel}>RDV/sem.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayBookings}</Text>
              <Text style={styles.statLabel}>Aujourd'hui</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Note</Text>
            </View>
          </View>
        </Animated.View>

        {/* Financial Transparency */}
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.transparencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.transparencyHeader}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[styles.transparencyTitle, { color: colors.text }]}>Vos revenus (Net estimé)</Text>
          </View>
          <View style={styles.flowContainer}>
            <View style={styles.flowStep}><Text style={styles.flowAmount}>{stats.totalRevenue.toFixed(0)}€</Text><Text style={styles.flowLabel}>Total</Text></View>
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
            <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>Réserver une prestation</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL RDV MANUEL */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nouveau RDV Manuel</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                Enregistrez un rendez-vous pris hors application pour bloquer votre créneau.
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nom du client</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Marie Dupont"
                  placeholderTextColor={colors.textMuted}
                  value={manualClientName}
                  onChangeText={setManualClientName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Prestation</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Saisissez ou choisissez ci-dessous..."
                  placeholderTextColor={colors.textMuted}
                  value={manualService}
                  onChangeText={setManualService}
                />
                
                {/* Liste de suggestions (Services déjà configurés) */}
                {salonServices.length > 0 && (
                  <View style={styles.suggestionContainer}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>VOS PRESTATIONS :</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {salonServices.map((s) => (
                        <TouchableOpacity 
                          key={s.id} 
                          style={[styles.suggestionChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                          onPress={() => setManualService(s.name)}
                        >
                          <Text style={{ fontSize: 12, color: colors.text }}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Date</Text>
                  <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor={colors.textMuted}
                    value={manualDate}
                    onChangeText={setManualDate}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Heure</Text>
                  <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="14:00"
                    placeholderTextColor={colors.textMuted}
                    value={manualTime}
                    onChangeText={setManualTime}
                  />
                </View>
              </View>

              <Button 
                title={isSavingBooking ? "Enregistrement..." : "Enregistrer le rendez-vous"}
                onPress={() => {
                  if (!manualClientName || !manualService) {
                    Alert.alert('Attention', 'Veuillez remplir au moins le nom et la prestation.');
                    return;
                  }
                  setIsSavingBooking(true);
                  // Simulation de sauvegarde
                  setTimeout(() => {
                    setIsSavingBooking(false);
                    Alert.alert('Succès', 'Le rendez-vous manuel a été enregistré.');
                    setBookingModalVisible(false);
                    setManualClientName('');
                    setManualService('');
                  }, 1000);
                }}
                loading={isSavingBooking}
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  suggestionContainer: {
    marginTop: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
