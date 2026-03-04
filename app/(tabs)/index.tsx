/**
 * Page d'accueil AfroPlan - Client (Version Vitrine Premium)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Shadows } from '@/constants/theme';
import { AuthGuardModal } from '@/components/ui';
import SearchFlowModal from '@/components/SearchFlowModal';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationModal from '@/components/NotificationModal';
import FeedbackModal from '@/components/FeedbackModal';
import { useSalons } from '@/hooks/use-salons';
import { useFavorites } from '@/hooks/use-favorites';
import { favoriteService } from '@/services/favorite.service';
import { SalonCard } from '@/components/ui';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const { width } = Dimensions.get('window');

const ALL_STYLES = HAIRSTYLE_CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.title,
  image: cat.styles[0]?.image,
}));

const TIPS_AND_INSPIRATION = [
  { id: '1', title: 'Comment entretenir ses tresses ?', category: 'Conseils', image: require('@/assets/images/entretien_cheveux.jpg'), readTime: '3 min' },
  { id: '2', title: 'Les tendances coiffures 2024', category: 'Tendances', image: require('@/assets/images/Photo_tendance.jpg'), readTime: '5 min' },
  { id: '3', title: 'Routine capillaire cheveux crépus', category: 'Tutoriel', image: require('@/assets/images/routine_capilaire.jpg'), readTime: '4 min' },
];

function SectionHeader({ title, onSeeAll, seeAllLabel }: { title: string; onSeeAll?: () => void; seeAllLabel?: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: '#191919' }]}>{seeAllLabel ?? 'Voir tout'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, profile, user } = useAuth();
  const { showAuthModal, setShowAuthModal } = useAuthGuard();
  const { t } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  const { salons, refresh: refreshSalons } = useSalons();
  const { favorites, refresh: refreshFavorites } = useFavorites(user?.id || '');
  const favoriteIds = React.useMemo(() => favorites.map(f => f.id), [favorites]);

  const handleToggleFavorite = async (salonId: string) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (!user) return;
    try { await favoriteService.toggleFavorite(user.id, salonId); refreshFavorites(); } catch (e) {}
  };

  const fetchActiveBookingsCount = React.useCallback(async () => {
    if (isAuthenticated && user?.id) {
      try {
        const { bookingService } = await import('@/services/booking.service');
        const response = await bookingService.getClientBookings(user.id);
        setActiveBookingsCount(response.data.filter(b => b.status === 'pending' || b.status === 'confirmed').length);
      } catch (e) {}
    }
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBookingsCount();
      refreshSalons();
    }, [fetchActiveBookingsCount, refreshSalons])
  );

  const handleSearch = (filters: any) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { 
        category: filters.hairstyle,
        city: filters.city,
      }
    });
  };

  const displayedStyles = showAllStyles ? ALL_STYLES : ALL_STYLES.slice(0, 6);
  const featuredSalons = [...salons].filter(s => s.is_verified).slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <SearchFlowModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} onSearch={handleSearch} />
      <NotificationModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} />

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refreshSalons()} tintColor={colors.primary} />}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoWrapper}>
              <Image source={require('@/assets/images/logo_afroplan.jpeg')} style={styles.logoImage} contentFit="contain" />
            </View>
            <View style={styles.authButtons}>
              {!isAuthenticated ? (
                <>
                  <LanguageSelector compact />
                  <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
                    <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.userInfoCompact}>
                    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                      {t('home.hello')}, {profile && profile.full_name ? profile.full_name.split(' ')[0] : t('profile.user')}
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]} onPress={() => setNotificationModalVisible(true)}>
                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                    {activeBookingsCount > 0 && <View style={styles.badge} />}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Search Button Premium */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.searchSection}>
          <TouchableOpacity style={styles.mainSearchButton} onPress={() => setSearchModalVisible(true)}>
            <View style={styles.searchButtonContent}>
              <View style={styles.searchIconContainer}><Ionicons name="search" size={22} color="#FFFFFF" /></View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchButtonTitle}>Disponible pour une nouvelle coiffure ?</Text>
                <Text style={styles.searchButtonSubtitle}>{t('home.searchSubtitle')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Featured */}
        {featuredSalons.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('home.featured')} onSeeAll={() => router.push('/(tabs)/explore')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredSalons.map(s => <SalonCard key={s.id} salon={s} variant="featured" isFavorite={favoriteIds.includes(s.id)} onFavoritePress={() => handleToggleFavorite(s.id)} />)}
            </ScrollView>
          </View>
        )}

        {/* Categories Grid */}
        <View style={styles.section}>
          <SectionHeader title={t('home.hairstyleCategories')} onSeeAll={() => setShowAllStyles(!showAllStyles)} seeAllLabel={showAllStyles ? t('home.seeLess') : t('common.seeAll')} />
          <View style={styles.stylesGrid}>
            {displayedStyles.map((style) => (
              <TouchableOpacity key={style.id} style={styles.styleCard} onPress={() => router.push(`/category-styles/${style.id}`)}>
                <Image source={style.image} style={styles.styleImage} contentFit="cover" />
                <View style={styles.styleOverlay}><Text style={styles.styleName} numberOfLines={2}>{style.name}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular */}
        <View style={styles.section}>
          <SectionHeader title={t('home.popularSalons')} onSeeAll={() => router.push('/(tabs)/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {salons.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 6).map(s => <SalonCard key={s.id} salon={s} variant="default" isFavorite={favoriteIds.includes(s.id)} onFavoritePress={() => handleToggleFavorite(s.id)} />)}
          </ScrollView>
        </View>

        {/* Nearby */}
        <View style={styles.section}>
          <SectionHeader title={t('home.nearbyCoiffeurs')} onSeeAll={() => router.push('/(tabs)/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[...salons].reverse().slice(0, 6).map(s => <SalonCard key={s.id} salon={s} variant="default" isFavorite={favoriteIds.includes(s.id)} onFavoritePress={() => handleToggleFavorite(s.id)} />)}
          </ScrollView>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <SectionHeader title={t('home.tipsAndInspiration')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {TIPS_AND_INSPIRATION.map((item) => (
              <TouchableOpacity key={item.id} style={styles.tipCard}>
                <Image source={item.image} style={styles.tipImage} contentFit="cover" />
                <View style={styles.tipContent}>
                  <View style={styles.tipBadge}><Text style={styles.tipBadgeText}>{item.category}</Text></View>
                  <Text style={styles.tipTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.tipFooter}>
                    <Ionicons name="time-outline" size={14} color="#808080" />
                    <Text style={styles.tipTime}>{item.readTime}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Footer Dynamique & Premium */}
        <View style={[styles.footerSection, { backgroundColor: '#F9F8F8', borderTopWidth: 1, borderTopColor: '#EEEEEE' }]}>
          <View style={styles.footerBrand}>
            <Image source={require('@/assets/images/logo_afroplan.jpeg')} style={styles.footerLogo} contentFit="contain" />
            <Text style={styles.footerTagline}>L'excellence de la coiffure afro à portée de main.</Text>
          </View>

          <View style={styles.footerLinksRow}>
            <TouchableOpacity onPress={() => router.push('/terms' as any)}><Text style={styles.footerLink}>CGU</Text></TouchableOpacity>
            <View style={styles.footerLinkDivider} />
            <TouchableOpacity onPress={() => router.push('/privacy-policy' as any)}><Text style={styles.footerLink}>Confidentialité</Text></TouchableOpacity>
            <View style={styles.footerLinkDivider} />
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@afroplan.com')}><Text style={styles.footerLink}>Aide</Text></TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={[styles.socialIcon, Shadows.sm]} 
              onPress={() => Linking.openURL('https://www.instagram.com/afro._plan?igsh=ODRhaWt6aWpsdHY=')}
            >
              <Ionicons name="logo-instagram" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialIcon, Shadows.sm]} 
              onPress={() => Linking.openURL('https://www.linkedin.com/company/afro-plan/posts/?feedView=all')}
            >
              <Ionicons name="logo-linkedin" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.copyright}>© 2024 AfroPlan. Crafted with passion.</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <AuthGuardModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoWrapper: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E5E5' },
  logoImage: { width: '100%', height: '100%' },
  authButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginButton: { backgroundColor: '#191919', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  loginButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  notificationButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  userInfoCompact: { marginRight: 8 },
  welcomeText: { fontSize: 14 },
  searchSection: { paddingHorizontal: 16, paddingBottom: 8 },
  mainSearchButton: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: '#191919', ...Shadows.md },
  searchButtonContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  searchIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#191919', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  searchTextContainer: { flex: 1 },
  searchButtonTitle: { fontSize: 15, fontWeight: '700', color: '#191919' },
  searchButtonSubtitle: { fontSize: 12, color: '#808080', marginTop: 2 },
  section: { paddingTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  horizontalScroll: { paddingRight: 16, gap: 12 },
  stylesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  styleCard: { width: (width - 56) / 3, height: 110, borderRadius: 12, overflow: 'hidden' },
  styleImage: { width: '100%', height: '100%' },
  styleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
  styleName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  tipCard: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginRight: 12, ...Shadows.sm },
  tipImage: { width: '100%', height: 150 },
  tipContent: { padding: 16 },
  tipBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  tipBadgeText: { fontSize: 10, fontWeight: '700', color: '#191919', textTransform: 'uppercase' },
  tipTitle: { fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 12 },
  tipFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipTime: { fontSize: 12, color: '#808080' },
  footerSection: { padding: 30, alignItems: 'center' },
  footerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  socialRow: { flexDirection: 'row', gap: 15, marginBottom: 24 },
  socialIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#191919', alignItems: 'center', justifyContent: 'center' },
  copyright: { fontSize: 11, color: '#808080' },
  /* Premium Footer Styles */
  footerBrand: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  footerTagline: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 40,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191919',
  },
  footerLinkDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
  },
  /* Ultra-Design Footer Styles */
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
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
