/**
 * Coiffeurs à proximité spécialisés dans un style donné
 * Cliquer sur un salon → photos du travail sur ce style + contact + réservation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { findStyleById } from '@/constants/hairstyleCategories';

/* ─────────────────────────── MOCK DATA ─────────────────────────── */

const MOCK_SALONS = [
  {
    id: '1',
    name: 'Bella Coiffure',
    coiffeur: 'Marie Koné',
    rating: 4.9,
    reviews: 127,
    distance: '0.8 km',
    address: '12 Rue des Martyrs, Paris 18e',
    phone: '+33612345678',
    available: true,
    nextSlot: "Aujourd'hui 15h",
    minPrice: 45,
    coverImage:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
    portfolio: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    ],
    specialties: ['Box Braids', 'Knotless Braids', 'Cornrows'],
    isVerified: true,
  },
  {
    id: '2',
    name: 'Afro Style Studio',
    coiffeur: 'Fatou Diallo',
    rating: 4.8,
    reviews: 89,
    distance: '1.2 km',
    address: '8 Boulevard Voltaire, Paris 11e',
    phone: '+33623456789',
    available: true,
    nextSlot: 'Demain 10h',
    minPrice: 60,
    coverImage:
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600',
    portfolio: [
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
    ],
    specialties: ['Fausse Locs', 'Soft Locks', 'Butterfly Locks'],
    isVerified: true,
  },
  {
    id: '3',
    name: 'Natural Beauty Salon',
    coiffeur: 'Aminata Bamba',
    rating: 4.7,
    reviews: 64,
    distance: '2.1 km',
    address: "45 Avenue d'Italie, Paris 13e",
    phone: '+33634567890',
    available: false,
    nextSlot: 'Mercredi 14h',
    minPrice: 35,
    coverImage:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    portfolio: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
    ],
    specialties: ['Wash & Go', 'Bantu Knots', 'Twists'],
    isVerified: false,
  },
  {
    id: '4',
    name: 'Tresses & Co',
    coiffeur: 'Kadiatou Bah',
    rating: 4.6,
    reviews: 98,
    distance: '3.5 km',
    address: '23 Rue de Bagnolet, Paris 20e',
    phone: '+33645678901',
    available: true,
    nextSlot: "Aujourd'hui 18h",
    minPrice: 50,
    coverImage:
      'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=600',
    portfolio: [
      'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    ],
    specialties: ['Fulani Braids', 'Crochet Braids', 'Boho Braids'],
    isVerified: false,
  },
];

type MockSalon = (typeof MOCK_SALONS)[number];

/* ─────────────────────────── COMPOSANT ─────────────────────────── */

export default function StyleSalonsScreen() {
  const { styleId, styleName } = useLocalSearchParams<{
    styleId: string;
    styleName: string;
  }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [selectedSalon, setSelectedSalon] = useState<MockSalon | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  // Style metadata
  const styleInfo = findStyleById(styleId);
  const categoryColor = styleInfo?.category.color ?? '#191919';
  const displayName = styleName ?? styleInfo?.style.name ?? 'Style';

  const sortedSalons = [...MOCK_SALONS].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') return a.minPrice - b.minPrice;
    return parseFloat(a.distance) - parseFloat(b.distance);
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleBook = (salon: MockSalon) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour réserver',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    router.push(`/salon/${salon.id}`);
  };

  const handleDirections = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://maps.google.com/?q=${encoded}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar barStyle="dark-content" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.topBarSub, { color: colors.textMuted }]}>
            {sortedSalons.length} coiffeurs à proximité
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Style banner ── */}
      {styleInfo && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.styleBanner, { backgroundColor: categoryColor + '15', borderColor: categoryColor + '40' }]}
        >
          <Text style={styles.bannerEmoji}>{styleInfo.category.emoji}</Text>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerCategory, { color: categoryColor }]}>
              {styleInfo.category.title}
            </Text>
            {styleInfo.style.description && (
              <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                {styleInfo.style.description}
              </Text>
            )}
          </View>
          {styleInfo.style.duration && (
            <View style={[styles.bannerDurationBadge, { backgroundColor: categoryColor + '22', borderColor: categoryColor + '55' }]}>
              <Ionicons name="time-outline" size={12} color={categoryColor} />
              <Text style={[styles.bannerDurationText, { color: categoryColor }]}>{styleInfo.style.duration}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── Sort bar ── */}
      <View style={[styles.sortBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sortLabel, { color: colors.textMuted }]}>Trier par :</Text>
        {(['distance', 'rating', 'price'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.sortChip,
              sortBy === key
                ? { backgroundColor: '#191919' }
                : { backgroundColor: colors.card },
            ]}
            onPress={() => setSortBy(key)}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: sortBy === key ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {key === 'distance' ? 'Distance' : key === 'rating' ? 'Note' : 'Prix'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Salon list ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {sortedSalons.map((salon, index) => (
          <Animated.View
            key={salon.id}
            entering={FadeInUp.delay(index * 80).duration(400)}
          >
            <TouchableOpacity
              style={[styles.salonCard, { backgroundColor: colors.card }]}
              onPress={() => setSelectedSalon(salon)}
              activeOpacity={0.9}
            >
              {/* Photo principale du salon */}
              <View style={styles.salonCoverWrapper}>
                <Image
                  source={{ uri: salon.coverImage }}
                  style={styles.salonCover}
                  contentFit="cover"
                />
                {/* Badge "Photo principale" */}
                <View style={styles.mainPhotoBadge}>
                  <Ionicons name="image-outline" size={10} color="#FFFFFF" />
                  <Text style={styles.mainPhotoBadgeText}>Photo principale</Text>
                </View>
                <View
                  style={[
                    styles.availBadge,
                    { backgroundColor: salon.available ? '#22C55E' : '#4A4A4A' },
                  ]}
                >
                  <Text style={styles.availText}>
                    {salon.available ? 'Disponible' : 'Sur RDV'}
                  </Text>
                </View>
              </View>

              {/* Sous-photos : Réalisations du salon */}
              {salon.portfolio.length > 0 && (
                <View style={styles.portfolioSection}>
                  <View style={styles.portfolioHeader}>
                    <Ionicons name="images-outline" size={13} color="#808080" />
                    <Text style={styles.portfolioHeaderText}>Réalisations du salon</Text>
                    <Text style={styles.portfolioCount}>{salon.portfolio.length} photos</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.portfolioScroll}
                    contentContainerStyle={styles.portfolioContent}
                  >
                    {salon.portfolio.map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={styles.portfolioThumb}
                        contentFit="cover"
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Info */}
              <View style={styles.salonInfo}>
                <View style={styles.salonInfoRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.salonName, { color: colors.text }]}>
                        {salon.name}
                      </Text>
                      {salon.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                      )}
                    </View>
                    <Text style={[styles.coiffeurName, { color: colors.textSecondary }]}>
                      {salon.coiffeur}
                    </Text>
                  </View>
                  <View style={styles.ratingBlock}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.ratingValue, { color: colors.text }]}>
                      {salon.rating}
                    </Text>
                    <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                      ({salon.reviews})
                    </Text>
                  </View>
                </View>

                {/* Distance + next slot */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {salon.distance}
                    </Text>
                  </View>
                  <View style={styles.metaDot} />
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      {salon.nextSlot}
                    </Text>
                  </View>
                  <View style={styles.metaDot} />
                  <Text style={[styles.priceFrom, { color: categoryColor }]}>
                    À partir de {salon.minPrice}€
                  </Text>
                </View>

                {/* Specialty tags */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {salon.specialties.map((spec) => (
                    <View
                      key={spec}
                      style={[
                        styles.specTag,
                        { backgroundColor: categoryColor + '15', borderColor: categoryColor + '40' },
                      ]}
                    >
                      <Text style={[styles.specTagText, { color: categoryColor }]}>{spec}</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* CTA buttons */}
                <View style={styles.ctaRow}>
                  <TouchableOpacity
                    style={[styles.ctaSecondary, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleCall(salon.phone)}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.text} />
                    <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>Appeler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ctaSecondary, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleDirections(salon.address)}
                  >
                    <Ionicons name="navigate-outline" size={18} color={colors.text} />
                    <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>Itinéraire</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ctaPrimary, { backgroundColor: '#191919' }]}
                    onPress={() => handleBook(salon)}
                  >
                    <Text style={styles.ctaPrimaryText}>Réserver</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Salon Detail Modal (portfolio + infos) ── */}
      <Modal
        visible={!!selectedSalon}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSalon(null)}
      >
        {selectedSalon && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedSalon(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedSalon.name}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo principale du salon */}
              <View style={styles.modalCoverWrapper}>
                <Image
                  source={{ uri: selectedSalon.coverImage }}
                  style={styles.modalCover}
                  contentFit="cover"
                />
                <View style={styles.modalMainPhotoBadge}>
                  <Ionicons name="image-outline" size={11} color="#FFFFFF" />
                  <Text style={styles.modalMainPhotoBadgeText}>Photo principale</Text>
                </View>
              </View>

              <View style={styles.modalContent}>
                {/* Name + verified */}
                <View style={styles.nameRow}>
                  <Text style={[styles.modalSalonName, { color: colors.text }]}>
                    {selectedSalon.name}
                  </Text>
                  {selectedSalon.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.modalCoiffeur, { color: colors.textSecondary }]}>
                  par {selectedSalon.coiffeur}
                </Text>

                {/* Rating + distance */}
                <View style={styles.modalMetaRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={[styles.modalRating, { color: colors.text }]}>
                    {selectedSalon.rating}
                  </Text>
                  <Text style={[styles.modalReviews, { color: colors.textMuted }]}>
                    ({selectedSalon.reviews} avis)
                  </Text>
                  <View style={styles.metaDot} />
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {selectedSalon.distance}
                  </Text>
                </View>

                {/* Address */}
                <TouchableOpacity
                  style={styles.addressRow}
                  onPress={() => handleDirections(selectedSalon.address)}
                >
                  <Ionicons name="map-outline" size={16} color={categoryColor} />
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {selectedSalon.address}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Galerie photos du salon (sous-photos) */}
                <View style={styles.galleryHeader}>
                  <Ionicons name="images-outline" size={16} color={categoryColor} />
                  <Text style={[styles.portfolioTitle, { color: colors.text, marginBottom: 0 }]}>
                    Galerie photos
                  </Text>
                  <Text style={[styles.gallerySubLabel, { color: colors.textMuted }]}>
                    Réalisations sur "{displayName}"
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.portfolioLargeContent}
                  style={{ marginBottom: 20 }}
                >
                  {selectedSalon.portfolio.map((uri, i) => (
                    <Image
                      key={i}
                      source={{ uri }}
                      style={styles.portfolioLarge}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>

                {/* Specialties */}
                <Text style={[styles.portfolioTitle, { color: colors.text }]}>Spécialités</Text>
                <View style={styles.specRow}>
                  {selectedSalon.specialties.map((spec) => (
                    <View
                      key={spec}
                      style={[
                        styles.specTag,
                        {
                          backgroundColor: categoryColor + '15',
                          borderColor: categoryColor + '40',
                        },
                      ]}
                    >
                      <Text style={[styles.specTagText, { color: categoryColor }]}>{spec}</Text>
                    </View>
                  ))}
                </View>

                {/* Availability */}
                <View
                  style={[
                    styles.availCard,
                    { backgroundColor: selectedSalon.available ? '#22C55E15' : colors.card },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={selectedSalon.available ? '#22C55E' : colors.textSecondary}
                  />
                  <View>
                    <Text style={[styles.availLabel, { color: colors.text }]}>
                      Prochain créneau disponible
                    </Text>
                    <Text
                      style={[
                        styles.availSlot,
                        { color: selectedSalon.available ? '#22C55E' : colors.textSecondary },
                      ]}
                    >
                      {selectedSalon.nextSlot}
                    </Text>
                  </View>
                </View>

                {/* Info prix : défini par le coiffeur dans ses services */}
                <View style={[styles.priceInfoCard, { backgroundColor: categoryColor + '10', borderColor: categoryColor + '30' }]}>
                  <Ionicons name="information-circle-outline" size={16} color={categoryColor} />
                  <Text style={[styles.priceInfoText, { color: colors.textSecondary }]}>
                    Les tarifs sont fixés par le coiffeur. Consultez ses services pour les prix exacts.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom CTAs */}
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
              ]}
            >
              <TouchableOpacity
                style={[styles.footerCallBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleCall(selectedSalon.phone)}
              >
                <Ionicons name="call" size={20} color={colors.text} />
                <Text style={[styles.footerCallText, { color: colors.text }]}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBookBtn, { backgroundColor: '#191919' }]}
                onPress={() => {
                  setSelectedSalon(null);
                  handleBook(selectedSalon);
                }}
              >
                <Text style={styles.footerBookText}>Réserver maintenant</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

/* ─────────────────────────── STYLES ─────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  topBarSub: { fontSize: 12, marginTop: 1 },

  // Style banner
  styleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  bannerEmoji: { fontSize: 28 },
  bannerText: { flex: 1 },
  bannerCategory: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  bannerDesc: { fontSize: 12, lineHeight: 16 },
  bannerDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerDurationText: { fontSize: 12, fontWeight: '600' },

  // Sort bar
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  sortLabel: { fontSize: 12, marginRight: 4 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sortChipText: { fontSize: 12, fontWeight: '500' },

  // Salon card
  salonCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  salonCoverWrapper: { position: 'relative', height: 160 },
  salonCover: { width: '100%', height: '100%' },

  // Badge "Photo principale" sur la cover
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainPhotoBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '500' },

  // Section "Réalisations du salon"
  portfolioSection: { backgroundColor: 'transparent' },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  portfolioHeaderText: { fontSize: 11, fontWeight: '600', color: '#808080', flex: 1 },
  portfolioCount: { fontSize: 10, color: '#B0B0B0' },

  availBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  // Portfolio strip
  portfolioScroll: { backgroundColor: 'transparent' },
  portfolioContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  portfolioThumb: { width: 70, height: 70, borderRadius: 10 },

  // Info
  salonInfo: { padding: 14 },
  salonInfoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  salonName: { fontSize: 17, fontWeight: '700' },
  coiffeurName: { fontSize: 13, marginTop: 2 },
  ratingBlock: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: { fontSize: 14, fontWeight: '700' },
  ratingCount: { fontSize: 12 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#C0C0C0' },
  priceFrom: { fontSize: 12, fontWeight: '700' },

  specTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  specTagText: { fontSize: 11, fontWeight: '500' },

  // CTA row
  ctaRow: { flexDirection: 'row', gap: 8 },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 5,
  },
  ctaSecondaryText: { fontSize: 13, fontWeight: '500' },
  ctaPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  ctaPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Price info (replaces priceCard)
  priceInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  priceInfoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalCoverWrapper: { position: 'relative' },
  modalCover: { width: '100%', height: 220 },
  modalMainPhotoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modalMainPhotoBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '500' },

  // Gallery header dans le modal
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  gallerySubLabel: { fontSize: 12, fontStyle: 'italic' },
  modalContent: { padding: 16 },
  modalSalonName: { fontSize: 22, fontWeight: '700' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  modalCoiffeur: { fontSize: 14, marginBottom: 8 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  modalRating: { fontSize: 15, fontWeight: '700' },
  modalReviews: { fontSize: 13 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  addressText: { flex: 1, fontSize: 13 },

  portfolioTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  portfolioLargeContent: { gap: 10 },
  portfolioLarge: { width: 180, height: 200, borderRadius: 14 },

  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },

  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  availLabel: { fontSize: 13, fontWeight: '500', marginBottom: 3 },
  availSlot: { fontSize: 14, fontWeight: '700' },

  // (styles priceCard supprimés — prix définis par chaque coiffeur)

  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
  },
  footerCallText: { fontSize: 15, fontWeight: '600' },
  footerBookBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  footerBookText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
