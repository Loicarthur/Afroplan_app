/**
 * Page de detail d'un salon AfroPlan - Design Premium & Épuré
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalon, useFavorite } from '@/hooks';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui';
import { Service } from '@/types';
import { bookingService } from '@/services/booking.service';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const { width } = Dimensions.get('window');

function Rating({ value, count, showValue = false, showCount = false }: { value: number; count?: number; showValue?: boolean; showCount?: boolean }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={16} color="#FFB800" />
      {showValue && <Text style={[styles.ratingValue, { color: colors.text }]}>{value.toFixed(1)}</Text>}
      {showCount && <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({count || 0})</Text>}
    </View>
  );
}

export default function SalonDetailScreen() {
  const { id, service: preselectService } = useLocalSearchParams<{ id: string; service?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user, profile } = useAuth();
  const { t, language } = useLanguage();
  
  const { salon, isLoading } = useSalon(id || '');
  const { isFavorite, toggleFavorite, isToggling } = useFavorite(user?.id || '', id || '');

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [hasBooking, setHasBooking] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'services' | 'reviews' | 'about'>('services');

  React.useEffect(() => {
    const init = async () => {
      const role = await AsyncStorage.getItem('@afroplan_selected_role');
      setActiveRole(role);

      // Vérifier si le client a déjà réservé (et payé/confirmé) dans ce salon
      if (user?.id && id) {
        try {
          const { bookingService } = await import('@/services/booking.service');
          const response = await bookingService.getClientBookings(user.id);
          const userHasBooked = response.data.some(b => 
            b.salon_id === id && 
            (b.status === 'confirmed' || b.status === 'completed')
          );
          setHasBooking(userHasBooked);
        } catch (e) {
          setHasBooking(false);
        }
      }
    };
    init();
  }, [user?.id, id]);

  React.useEffect(() => {
    if (salon?.services && preselectService && selectedServices.length === 0) {
      const target = salon.services.find(s => s.name.toLowerCase() === preselectService.toLowerCase());
      if (target) setSelectedServices([target]);
    }
  }, [salon, preselectService]);

  const groupedServices = React.useMemo(() => {
    if (!salon?.services) return {};
    return salon.services.reduce((acc: Record<string, Service[]>, s: Service) => {
      const cat = s.category || 'Autres';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {});
  }, [salon?.services]);

  const toggleService = (service: Service) => {
    setSelectedServices(prev => prev.find(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]);
  };

  const handleBook = () => {
    if ((salon as any)?.is_today_blocked) {
      Alert.alert(t('common.attention'), language === 'fr' ? 'Ce salon est exceptionnellement fermé aujourd\'hui.' : 'This salon is exceptionally closed today.');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel') },
          { text: t('auth.login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert(t('common.attention'), language === 'fr' ? 'Veuillez sélectionner au moins une prestation.' : 'Please select at least one service.');
      return;
    }
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
    
    router.push({
      pathname: '/booking/[id]',
      params: { 
        id, 
        serviceId: selectedServices.map(s => s.id).join(','), 
        serviceName: selectedServices.map(s => s.name).join(', '), 
        servicePrice: totalPrice.toString(), 
        serviceDuration: totalDuration.toString() 
      }
    });
  };

  if (isLoading || !salon) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const imageUri = salon.cover_image_url || salon.image_url || (salon.photos?.[0]);
  const imageSource = typeof imageUri === 'string' ? { uri: imageUri } : imageUri;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Photo de couverture IMMERSIVE */}
        <View style={styles.headerPhoto}>
          <Image source={imageSource || { uri: 'https://via.placeholder.com/600x400' }} style={styles.coverImage} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
          
          <SafeAreaView style={styles.headerButtons} edges={['top']}>
            <TouchableOpacity style={styles.roundButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.roundButton} 
              onPress={() => toggleFavorite()}
              disabled={isToggling}
            >
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#EF4444" : "#FFF"} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* 2. Infos de base */}
        <View style={[styles.mainInfo, { backgroundColor: colors.background }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.salonName, { color: colors.text }]}>{salon.name}</Text>
            {salon.is_verified && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
          </View>
          <View style={styles.metaRow}>
            <Rating value={salon.rating} count={salon.reviews_count} showValue showCount />
            <Text style={{ color: colors.textMuted }}> • </Text>
            <Text style={{ color: colors.textSecondary }}>{salon.city}</Text>
          </View>
          
          {/* 3. VITRINE IMMÉDIATE (Vos réalisations) */}
          {salon.gallery && salon.gallery.length > 0 && (
            <View style={styles.vitrineSection}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>{t('salon.gallery')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitrineScroll}>
                {salon.gallery.map((img) => (
                  <View key={img.id} style={styles.vitrineThumb}>
                    <Image source={{ uri: img.image_url }} style={styles.vitrineImg} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.quickActions}>
            {hasBooking ? (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]} onPress={() => Linking.openURL(`tel:${salon.phone}`)}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('salon.call')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]} onPress={() => Linking.openURL(`https://maps.google.com/?q=${salon.address}`)}>
                  <Ionicons name="navigate" size={18} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t('salon.directions')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.restrictedBox, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
                <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
                  {language === 'fr' ? 'Réservez pour débloquer le contact et l\'itinéraire' : 'Book to unlock contact and directions'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Onglets de Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {[
            { id: 'services', label: t('salon.services') },
            { id: 'reviews', label: t('salon.reviews') },
            { id: 'about', label: t('salon.about') },
          ].map((tTab) => (
            <TouchableOpacity 
              key={tTab.id} 
              style={[styles.tabItem, activeDetailTab === tTab.id && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]} 
              onPress={() => setActiveDetailTab(tTab.id as any)}
            >
              <Text style={[styles.tabLabel, { color: activeDetailTab === tTab.id ? colors.primary : colors.textMuted }]}>{tTab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Contenu des Onglets */}
        <View style={styles.tabContent}>
          {activeDetailTab === 'services' && (
            <View>
              {Object.entries(groupedServices).map(([cat, svcs]) => (
                <View key={cat} style={styles.catSection}>
                  <Text style={[styles.catHeader, { color: colors.text }]}>{cat}</Text>
                  <View style={styles.servicesGrid}>
                    {svcs.map(s => {
                      const sel = selectedServices.some(x => x.id === s.id);
                      const catalogImg = HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).find(cs => cs.name === s.name)?.image;
                      return (
                        <TouchableOpacity 
                          key={s.id} 
                          style={[styles.svcLargeCard, { backgroundColor: colors.card, borderColor: sel ? colors.primary : colors.border }]} 
                          onPress={() => toggleService(s)}
                          activeOpacity={0.8}
                        >
                          <Image source={s.image_url ? { uri: s.image_url } : catalogImg} style={styles.svcLargeImg} contentFit="cover" />
                          <View style={styles.svcLargeInfo}>
                            <Text style={[styles.svcNameLarge, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                            <Text style={[styles.svcPriceLarge, { color: colors.primary }]}>{s.price}€</Text>
                            <View style={styles.svcMetaRow}>
                              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                              <Text style={styles.svcMetaText}>{s.duration_minutes} min</Text>
                            </View>
                          </View>
                          {sel && (
                            <View style={[styles.selectionBadge, { backgroundColor: colors.primary }]}>
                              <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeDetailTab === 'reviews' && (
            <View style={styles.reviewsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>{t('salon.reviews')}</Text>
              {salon.reviews && salon.reviews.length > 0 ? (
                salon.reviews.map((review: any) => (
                  <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.reviewHeader}><Text style={[styles.reviewerName, { color: colors.text }]}>{review.client_name || t('profile.user')}</Text><Rating value={review.rating} /></View>
                    <Text style={[styles.reviewText, { color: colors.textSecondary }]}>{review.comment}</Text>
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{new Date(review.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}><Ionicons name="star-outline" size={48} color={colors.textMuted} /><Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('salon.noReviews')}</Text></View>
              )}
            </View>
          )}

          {activeDetailTab === 'about' && (
            <View style={styles.aboutContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('salon.about')}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{salon.description || t('home.welcome')}</Text>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>{t('salon.openingHours')}</Text>
              <View style={[styles.hoursBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {(() => {
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const labels: Record<string, string> = { 
                    monday: language === 'fr' ? 'Lundi' : language === 'en' ? 'Monday' : language === 'de' ? 'Montag' : 'Lunes', 
                    tuesday: language === 'fr' ? 'Mardi' : language === 'en' ? 'Tuesday' : language === 'de' ? 'Dienstag' : 'Martes', 
                    wednesday: language === 'fr' ? 'Mercredi' : language === 'en' ? 'Wednesday' : language === 'de' ? 'Mittwoch' : 'Miércoles', 
                    thursday: language === 'fr' ? 'Jeudi' : language === 'en' ? 'Thursday' : language === 'de' ? 'Donnerstag' : 'Jueves', 
                    friday: language === 'fr' ? 'Vendredi' : language === 'en' ? 'Friday' : language === 'de' ? 'Freitag' : 'Viernes', 
                    saturday: language === 'fr' ? 'Samedi' : language === 'en' ? 'Saturday' : language === 'de' ? 'Samstag' : 'Sábado', 
                    sunday: language === 'fr' ? 'Dimanche' : language === 'en' ? 'Sunday' : language === 'de' ? 'Sonntag' : 'Domingo' 
                  };
                  const hours = typeof salon.opening_hours === 'string' ? JSON.parse(salon.opening_hours) : salon.opening_hours;
                  const currentDay = (new Date().getDay() + 6) % 7;
                  return days.map((day, idx) => {
                    const sched = hours?.[day] || hours?.[day.charAt(0).toUpperCase() + day.slice(1)];
                    const isToday = idx === currentDay;
                    let text = language === 'fr' ? 'Fermé' : language === 'en' ? 'Closed' : language === 'de' ? 'Geschlossen' : 'Cerrado';
                    if (sched && !sched.closed && !sched.isClosed) text = `${sched.open || sched.start} - ${sched.close || sched.end}`;
                    return (
                      <View key={day} style={styles.hourRow}>
                        <Text style={{ color: isToday ? colors.primary : colors.text, fontWeight: isToday ? '700' : '400' }}>{labels[day]}</Text>
                        <Text style={{ color: isToday ? colors.primary : colors.textSecondary, fontWeight: isToday ? '700' : '400' }}>{text}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Flottant */}
      <View style={[styles.floatingFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerCount, { color: colors.text }]}>{selectedServices.length} {t('salon.selectedServices')}</Text>
          <Text style={[styles.footerPrice, { color: colors.primary }]}>{selectedServices.reduce((sum, s) => sum + s.price, 0)}€</Text>
        </View>
        <Button title={t('booking.book')} onPress={handleBook} style={{ flex: 1, marginLeft: 20 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerPhoto: { width: '100%', height: 280 },
  coverImage: { width: '100%', height: '100%' },
  headerButtons: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  mainInfo: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  salonName: { fontSize: 24, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontWeight: '700', fontSize: 14 },
  ratingCount: { fontSize: 12 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  actionBtnText: { fontWeight: '700', fontSize: 13 },
  restrictedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
  },
  restrictedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Vitrine Section
  vitrineSection: { marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  vitrineScroll: { gap: 12 },
  vitrineThumb: { width: 150, height: 150, borderRadius: 20, overflow: 'hidden' },
  vitrineImg: { width: '100%', height: '100%' },

  // Tabs
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1 },
  tabItem: { paddingVertical: 15, marginRight: 30 },
  tabLabel: { fontSize: 15, fontWeight: '700' },
  tabContent: { padding: 20 },

  // Prestations Grid (EN PLUS GRAND)
  catSection: { marginBottom: 30 },
  catHeader: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  svcLargeCard: { width: (width - 52) / 2, borderRadius: 20, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  svcLargeImg: { width: '100%', height: 140 },
  svcLargeInfo: { padding: 12 },
  svcNameLarge: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  svcPriceLarge: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  svcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  svcMetaText: { fontSize: 11, color: '#999' },
  selectionBadge: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  floatingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, ...Shadows.lg },
  footerInfo: { justifyContent: 'center' },
  footerCount: { fontSize: 11, opacity: 0.6 },
  footerPrice: { fontSize: 20, fontWeight: '800' },
  
  aboutContainer: { gap: 15 },
  description: { fontSize: 15, lineHeight: 22 },
  hoursBox: { padding: 15, borderRadius: 16, borderWidth: 1, gap: 10 },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewsContainer: { gap: 12 },
  reviewCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewerName: { fontSize: 14, fontWeight: '700' },
  reviewText: { fontSize: 13, lineHeight: 20 },
  reviewDate: { fontSize: 10, opacity: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
});
