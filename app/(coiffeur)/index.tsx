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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown, FadeInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { salonService } from '@/services/salon.service';
import { bookingService } from '@/services/booking.service';
import { coiffeurService } from '@/services/coiffeur.service';
import { paymentService } from '@/services/payment.service';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';
import NotificationModal from '@/components/NotificationModal';
import FeedbackModal from '@/components/FeedbackModal';

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
  const [revenueStats, setRevenueStats] = useState<any>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    dailyNet: 0,
    weeklyNet: 0,
    monthlyNet: 0,
    totalNet: 0,
  });
  
  // Modals & States
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [salonServices, setSalonServices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
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
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // On lance les appels sans attendre le résultat pour libérer l'UI immédiatement
        Promise.all([
          salonService.getSalonById(salonData.id).catch(() => null),
          bookingService.getSalonBookings(salonData.id, undefined, todayStr).catch(() => ({ data: [] })),
          salonService.getSalonStats(salonData.id).catch(() => null),
          paymentService.getDetailedRevenueStats(salonData.id).catch(() => null),
          paymentService.getSalonPayments(salonData.id, 1, 10).catch(() => ({ data: [] }))
        ]).then(([fullSalonRes, bookingsRes, statsRes, revenueRes, paymentsRes]) => {
          if (fullSalonRes) setSalon(fullSalonRes);
          if (bookingsRes) {
            setTodayBookings(bookingsRes.data || []);
          }
          if (statsRes) setAllTimeStats(statsRes);
          if (revenueRes) setRevenueStats(revenueRes);
          if (paymentsRes) setTransactions(paymentsRes.data || []);
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
  const activeTodayCount = todayBookings.filter(b => b.status !== 'cancelled').length;

  // Rendu selon l'état réel des données
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Header minimaliste comme côté client */}
          <View style={styles.headerClientStyle}>
            <View style={styles.logoWrapperClientStyle}>
              <Image source={require('@/assets/images/logo_afroplan.jpeg')} style={styles.logoImageClientStyle} contentFit="contain" />
            </View>
            <TouchableOpacity style={styles.loginButtonClientStyle} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginButtonTextClientStyle}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Banner Pro */}
          <View style={styles.heroSectionClientStyle}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.heroImageClientStyle}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroOverlayClientStyle}>
              <View style={styles.proBadgeClientStyle}>
                <Text style={styles.proBadgeTextClientStyle}>POUR LES PROFESSIONNELS</Text>
              </View>
              <Text style={styles.heroTitleClientStyle}>Vivez de votre{"\n"}passion coiffure.</Text>
            </View>
          </View>

          {/* Main Action Button (Style Barre de recherche client) */}
          <View style={styles.searchSectionClientStyle}>
            <TouchableOpacity style={styles.mainActionContainerClientStyle} onPress={() => router.push('/(auth)/register')}>
              <View style={styles.actionIconContainerClientStyle}>
                <Ionicons name="rocket" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.actionTextContainerClientStyle}>
                <Text style={styles.actionTitleClientStyle}>Prêt à digitaliser votre salon ?</Text>
                <Text style={styles.actionSubtitleClientStyle}>Ouvrez votre compte Pro gratuitement en 2 min</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#808080" />
            </TouchableOpacity>
          </View>

          {/* Benefits Section (Cards style client) */}
          <View style={styles.sectionClientStyle}>
            <Text style={styles.sectionTitleClientStyle}>Pourquoi AfroPlan Pro ?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollClientStyle}>
              <View style={[styles.benefitCardClientStyle, Shadows.sm]}>
                <View style={[styles.benefitIconWrapperClientStyle, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="trending-up" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.benefitTitleClientStyle}>Visibilité boostée</Text>
                <Text style={styles.benefitDescClientStyle}>Soyez vu par des milliers de clients locaux chaque jour.</Text>
              </View>

              <View style={[styles.benefitCardClientStyle, Shadows.sm]}>
                <View style={[styles.benefitIconWrapperClientStyle, { backgroundColor: '#22C55E20' }]}>
                  <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
                </View>
                <Text style={styles.benefitTitleClientStyle}>Acomptes garantis</Text>
                <Text style={styles.benefitDescClientStyle}>Finis les rendez-vous non honorés. Encaissez des acomptes.</Text>
              </View>

              <View style={[styles.benefitCardClientStyle, Shadows.sm]}>
                <View style={[styles.benefitIconWrapperClientStyle, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="calendar" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.benefitTitleClientStyle}>Gestion 24h/24</Text>
                <Text style={styles.benefitDescClientStyle}>Vos clients réservent même pendant que vous dormez.</Text>
              </View>
            </ScrollView>
          </View>

          {/* Inspiration Section */}
          <View style={styles.sectionClientStyle}>
            <Text style={styles.sectionTitleClientStyle}>Ils ont sauté le pas</Text>
            <View style={styles.testimonialContainerClientStyle}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.testimonialImageClientStyle}
              />
              <View style={styles.testimonialContentClientStyle}>
                <Text style={styles.testimonialQuoteClientStyle}>"AfroPlan a littéralement transformé mon salon. Plus de coups de fil pendant mes prestations, tout se gère tout seul !"</Text>
                <Text style={styles.testimonialAuthorClientStyle}>Sarah, <Text style={{fontWeight: '400'}}>Salon AfroChic</Text></Text>
              </View>
            </View>
          </View>

          {/* Footer Premium Pro Restauré */}
          <View style={[styles.footerSectionClientStyle, { backgroundColor: '#F9F8F8', borderTopWidth: 1, borderTopColor: '#EEEEEE' }]}>
            <View style={styles.footerBrand}>
              <Image source={require('@/assets/images/logo_afroplan.jpeg')} style={styles.footerLogo} contentFit="contain" />
              <Text style={styles.footerTagline}>La plateforme de référence pour les experts de la coiffure afro.</Text>
            </View>

            <View style={styles.footerLinksRow}>
              <TouchableOpacity onPress={() => router.push('/terms' as any)}><Text style={styles.footerLink}>CGU</Text></TouchableOpacity>
              <View style={styles.footerLinkDivider} />
              <TouchableOpacity onPress={() => router.push('/privacy-policy' as any)}><Text style={styles.footerLink}>Confidentialité</Text></TouchableOpacity>
              <View style={styles.footerLinkDivider} />
              <TouchableOpacity onPress={() => Linking.openURL('mailto:pro@afroplan.com')}><Text style={styles.footerLink}>Support Pro</Text></TouchableOpacity>
            </View>

            <View style={styles.socialRowClientStyle}>
              <TouchableOpacity 
                style={[styles.socialIconClientStyle, Shadows.sm]} 
                onPress={() => Linking.openURL('https://www.instagram.com/afro._plan?igsh=ODRhaWt6aWpsdHY=')}
              >
                <Ionicons name="logo-instagram" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIconClientStyle, Shadows.sm]}
                onPress={() => Linking.openURL('https://www.linkedin.com/company/afro-plan/posts/?feedView=all')}
              >
                <Ionicons name="logo-linkedin" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.copyrightClientStyle}>© 2024 AfroPlan Pro. Pour les passionnés d'afro.</Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loadingSalon && !salon) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>{t('coiffeur.init')}</Text>
      </View>
    );
  }

  const dashboardStats = {
    todayBookings: activeTodayCount,
    pendingBookings: pendingBookingsCount,
    totalRevenue: Math.max(revenueStats.total / 100, allTimeStats?.totalRevenue || 0),
    monthlyRevenue: Math.max(revenueStats.monthly / 100, (allTimeStats?.monthlyRevenue || 0)),
    monthlyNet: Math.max((revenueStats.monthlyNet || 0) / 100, (Math.max(revenueStats.monthly / 100, (allTimeStats?.monthlyRevenue || 0)) * 0.8)),
    dailyRevenue: revenueStats.daily / 100,
    dailyNet: revenueStats.dailyNet / 100,
    averageRating: allTimeStats?.averageRating || 0,
  };

  // Écran de création si vraiment aucun salon n'est trouvé après chargement
  if (!salon) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="storefront-outline" size={80} color={colors.primary} />
          <Text style={[styles.userName, { textAlign: 'center', marginTop: 20 }]}>{t('coiffeur.readyToLaunch')}</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>{t('coiffeur.setupShowcase')}</Text>
          <Button title={t('coiffeur.createSalon')} onPress={() => router.push('/(coiffeur)/salon')} style={{ marginTop: 30, width: '100%' }} />
          <TouchableOpacity onPress={handleSwitchToClient} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('role.switchToClient')}</Text>
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
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('coiffeur.dashboard')}</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{salon.name || profile?.full_name || 'Coiffeur'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              {dashboardStats.pendingBookings > 0 && <View style={styles.badge} />}
              </TouchableOpacity>
          </View>
        </View>

        {/* Performance Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.businessCard, { backgroundColor: '#191919' }]}>
          <View style={styles.businessHeader}>
            <View>
              <Text style={styles.businessLabel}>{language === 'fr' ? 'Revenu du mois' : 'Monthly Revenue'}</Text>
              <Text style={styles.businessValue}>{dashboardStats.monthlyRevenue.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2 })} €</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                {language === 'fr' ? 'Aujourd\'hui' : 'Today'} : +{dashboardStats.dailyRevenue.toFixed(2)} €
              </Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color="#22C55E" />
              <Text style={styles.growthText}>{t('coiffeur.activity')}</Text>
            </View>
          </View>
          <View style={styles.footerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{allTimeStats?.weeklyBookingsCount || 0}</Text>
              <Text style={styles.statLabel}>{t('coiffeur.weeklyAppt')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardStats.todayBookings}</Text>
              <Text style={styles.statLabel}>{t('coiffeur.today')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboardStats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t('coiffeur.rating')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Financial Transparency - Réduit pour laisser de la place */}
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.transparencyCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 10 }]}>
          <View style={styles.transparencyHeader}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[styles.transparencyTitle, { color: colors.text }]}>
              Net ce mois : {((revenueStats.monthlyNet || 0) / 100).toFixed(0)}€
            </Text>
            <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Détails →</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginLeft: 28, marginTop: -12 }}>
            Net aujourd'hui : {((revenueStats.dailyNet || 0) / 100).toFixed(2)}€
          </Text>
        </Animated.View>

        {/* NOUVEAU : CENTRE DE COMMANDE UNIFIÉ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gestion de mon activité</Text>
          <View style={styles.managementGrid}>
            <TouchableOpacity 
              style={[styles.mgmtItem, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(coiffeur)/services' as any)}
            >
              <View style={[styles.mgmtIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="cut-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.mgmtText, { color: colors.text }]}>Services & Tarifs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mgmtItem, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(coiffeur)/portfolio' as any)}
            >
              <View style={[styles.mgmtIcon, { backgroundColor: '#EC489915' }]}>
                <Ionicons name="images-outline" size={24} color="#EC4899" />
              </View>
              <Text style={[styles.mgmtText, { color: colors.text }]}>Portfolio</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mgmtItem, { backgroundColor: colors.card }]} 
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={[styles.mgmtIcon, { backgroundColor: '#22C55E15' }]}>
                <Ionicons name="cash-outline" size={24} color="#22C55E" />
              </View>
              <Text style={[styles.mgmtText, { color: colors.text }]}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mgmtItem, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(salon)/reviews' as any)}
            >
              <View style={[styles.mgmtIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="star-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.mgmtText, { color: colors.text }]}>Avis Clients</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.mgmtItem, { backgroundColor: colors.card }]} 
              onPress={() => router.push('/(coiffeur)/salon' as any)}
            >
              <View style={[styles.mgmtIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="business-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.mgmtText, { color: colors.text }]}>Infos Salon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Pro Actions (Boost & Manuel) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions Rapides</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.proActionButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]} onPress={handleLastMinuteBoost}>
              <Ionicons name="rocket-outline" size={24} color={colors.primary} />
              <Text style={[styles.proActionText, { color: colors.primary }]}>{t('coiffeur.flashBoost')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.proActionButton, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]} onPress={() => setBookingModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={24} color={colors.success} />
              <Text style={[styles.proActionText, { color: colors.success }]}>{t('coiffeur.manualAppt')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Switching Mode */}
        <TouchableOpacity style={[styles.switchCard, { backgroundColor: colors.card }]} onPress={handleSwitchToClient}>
          <Ionicons name="people-outline" size={24} color={colors.primary} />
          <View style={styles.switchContent}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>{t('coiffeur.clientMode')}</Text>
            <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>{t('coiffeur.bookService')}</Text>
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('coiffeur.manualApptTitle')}</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                {t('coiffeur.manualApptDesc')}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('coiffeur.clientName')}</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Marie Dupont"
                  placeholderTextColor={colors.textMuted}
                  value={manualClientName}
                  onChangeText={setManualClientName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('coiffeur.service')}</Text>
                <TextInput 
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder={language === 'fr' ? 'Saisissez ou choisissez ci-dessous...' : 'Type or choose below...'}
                  placeholderTextColor={colors.textMuted}
                  value={manualService}
                  onChangeText={setManualService}
                />
                
                {/* Liste de suggestions (Services déjà configurés) */}
                {salonServices.length > 0 && (
                  <View style={styles.suggestionContainer}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>{t('coiffeur.yourServices')} :</Text>
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
                  <Text style={[styles.label, { color: colors.text }]}>{t('coiffeur.date')}</Text>
                  <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor={colors.textMuted}
                    value={manualDate}
                    onChangeText={setManualDate}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('coiffeur.time')}</Text>
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
                title={isSavingBooking ? t('common.loading') : t('coiffeur.saveAppt')}
                onPress={() => {
                  if (!manualClientName || !manualService) {
                    Alert.alert(t('common.attention'), language === 'fr' ? 'Veuillez remplir au moins le nom et la prestation.' : 'Please fill at least name and service.');
                    return;
                  }
                  setIsSavingBooking(true);
                  // Simulation de sauvegarde
                  setTimeout(() => {
                    setIsSavingBooking(false);
                    Alert.alert(t('common.success'), language === 'fr' ? 'Le rendez-vous manuel a été enregistré.' : 'The manual appointment has been saved.');
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

      {/* ── PORTEFEUILLE MODAL ── */}
      <Modal
        visible={walletModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Mon Portefeuille</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.balanceBox, { backgroundColor: '#191919' }]}>
              <Text style={styles.balanceLabel}>Net ce mois (80%)</Text>
              <Text style={styles.balanceValue}>
                {((revenueStats.monthlyNet || 0) / 100).toFixed(2)} €
              </Text>
              <TouchableOpacity 
                style={styles.payoutButton}
                onPress={() => Alert.alert('Virement', 'Demande de virement envoyée vers votre RIB.')}
              >
                <Text style={styles.payoutButtonText}>Demander un virement</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Les virements sont effectués sous 48h ouvrées.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── HISTORIQUE GAINS MODAL ── */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Statistiques du mois</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.historySummary}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Brut (Mois)</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{((revenueStats.monthly || 0) / 100).toFixed(2)}€</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net (Mois)</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>{((revenueStats.monthlyNet || 0) / 100).toFixed(2)}€</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitleModal, { color: colors.text }]}>Dernières transactions</Text>
              {transactions.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted, marginTop: 20 }]}>
                  Aucune transaction récente à afficher.
                </Text>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} style={[styles.txItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.txLeft}>
                      <Text style={[styles.txService, { color: colors.text }]}>{tx.booking?.service?.name || 'Prestation'}</Text>
                      <Text style={[styles.txDate, { color: colors.textMuted }]}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: colors.success }]}>+{(tx.salon_amount / 100).toFixed(2)}€</Text>
                      <Text style={styles.txNetLabel}>Net (80%)</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NotificationModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />
      <FeedbackModal visible={feedbackModalVisible} onClose={() => setFeedbackModalVisible(false)} />

      {/* Floating Feedback Button */}
      <TouchableOpacity 
        style={[styles.floatingFeedback, Shadows.lg]} 
        onPress={() => setFeedbackModalVisible(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
      </TouchableOpacity>
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
  /* Management Grid Styles */
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  mgmtItem: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Shadows.sm,
  },
  mgmtIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mgmtText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
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
  balanceBox: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  payoutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  payoutButtonText: {
    color: '#191919',
    fontWeight: '700',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  historySummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 10,
  },
  sectionTitleModal: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  /* Transaction Styles */
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  txLeft: {
    flex: 1,
  },
  txService: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  txNetLabel: {
    fontSize: 10,
    color: '#808080',
    fontWeight: '500',
  },
  /* Landing Page Pro Styles */
  heroPro: {
    padding: 30,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroTitlePro: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    marginBottom: 16,
  },
  heroSubtitlePro: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  heroButtonPro: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
  },
  loginLinkPro: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkTextPro: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  statsContainerPro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    marginTop: -20,
  },
  statBoxPro: {
    flex: 1,
    alignItems: 'center',
  },
  statNumberPro: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabelPro: {
    fontSize: 12,
    marginTop: 4,
  },
  statDividerPro: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginTop: 10,
  },
  benefitsSectionPro: {
    padding: 20,
  },
  sectionTitlePro: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    paddingLeft: 10,
  },
  benefitCardPro: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  benefitIconPro: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContentPro: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitlePro: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDescPro: {
    fontSize: 13,
    lineHeight: 18,
  },
  /* Premium Landing Styles */
  heroContainerPremium: {
    height: 450,
    width: '100%',
    justifyContent: 'flex-end',
    padding: 30,
    paddingBottom: 50,
  },
  proBadgeHero: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroContentPremium: {
    zIndex: 1,
  },
  heroTitlePremium: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroSubtitlePremium: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '90%',
  },
  floatingContainer: {
    marginTop: -30,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  incomeCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  incomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#22C55E15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  incomeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191919',
  },
  mainContentPremium: {
    padding: 20,
    backgroundColor: '#000',
  },
  sectionTitlePremium: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 40,
    marginBottom: 30,
    textAlign: 'center',
  },
  featureGridPro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItemPro: {
    width: (width - 56) / 2,
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureIconPro: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitlePro: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureDescPro: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  testimonialCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    marginTop: 40,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  testimonialAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  testimonialContent: {
    flex: 1,
  },
  testimonialQuote: {
    color: '#FFF',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  testimonialAuthor: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ratingStars: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 2,
  },
  ctaContainerPremium: {
    marginTop: 50,
    gap: 16,
  },
  mainCtaPro: {
    backgroundColor: '#FFF',
    height: 64,
    borderRadius: 20,
  },
  secondaryCtaPro: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryCtaTextPro: {
    color: '#888',
    fontSize: 14,
  },
  /* Minimalist Landing Styles */
  minimalContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 30,
    paddingBottom: 60,
  },
  brandTag: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.8,
  },
  minimalTitle: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 46,
    marginBottom: 20,
  },
  minimalSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: '90%',
  },
  ctaWrapper: {
    gap: 20,
  },
  singleCta: {
    backgroundColor: '#FFF',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  singleCtaText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  loginLinkMinimal: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginLinkTextMinimal: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  /* Client-Style Design for Coiffeur Landing */
  headerClientStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoWrapperClientStyle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  logoImageClientStyle: {
    width: '100%',
    height: '100%',
  },
  loginButtonClientStyle: {
    backgroundColor: '#191919',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginButtonTextClientStyle: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  heroSectionClientStyle: {
    height: 240,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroImageClientStyle: {
    width: '100%',
    height: '100%',
  },
  heroOverlayClientStyle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    justifyContent: 'flex-end',
  },
  proBadgeClientStyle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  proBadgeTextClientStyle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitleClientStyle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  searchSectionClientStyle: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  mainActionContainerClientStyle: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#191919',
    ...Shadows.md,
  },
  actionIconContainerClientStyle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainerClientStyle: {
    flex: 1,
  },
  actionTitleClientStyle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191919',
  },
  actionSubtitleClientStyle: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  sectionClientStyle: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitleClientStyle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 16,
  },
  horizontalScrollClientStyle: {
    paddingRight: 16,
    gap: 12,
  },
  benefitCardClientStyle: {
    width: 220,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginRight: 4,
  },
  benefitIconWrapperClientStyle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  benefitTitleClientStyle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 8,
  },
  benefitDescClientStyle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  testimonialContainerClientStyle: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Shadows.sm,
  },
  testimonialImageClientStyle: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  testimonialContentClientStyle: {
    flex: 1,
  },
  testimonialQuoteClientStyle: {
    fontSize: 13,
    color: '#191919',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  testimonialAuthorClientStyle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191919',
  },
  footerSectionClientStyle: {
    marginTop: 40,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9F8F8',
  },
  footerTitleClientStyle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 16,
  },
  socialRowClientStyle: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 24,
  },
  socialIconClientStyle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyrightClientStyle: {
    fontSize: 11,
    color: '#808080',
    textAlign: 'center',
  },
  /* Ultra-Design Footer Styles */
  footerSectionUltra: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  footerBrandCol: {
    flex: 1.5,
    paddingRight: 20,
  },
  footerLogoPremium: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerBrandName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  footerBrandDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 18,
  },
  footerLinksCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerColTitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
    opacity: 0.4,
  },
  footerLinkNew: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    opacity: 0.8,
  },
  footerDividerNew: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 24,
  },
  footerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  copyrightNew: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  socialGridNew: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIconNew: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  floatingFeedback: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
