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
import { useSalons } from '@/hooks/use-salons';
import { SalonCard } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { findStyleById } from '@/constants/hairstyleCategories';

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

  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'newest'>('rating');

  // Style metadata
  const styleInfo = findStyleById(styleId);
  const categoryColor = styleInfo?.category.color ?? '#191919';
  const displayName = styleName ?? styleInfo?.style.name ?? 'Style';

  // Récupérer les salons réels filtrés par cette catégorie/style
  const { salons: realSalons, isLoading } = useSalons({
    category: styleInfo?.category.title || styleName,
  });

  const sortedSalons = [...realSalons].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    return 0; // Default
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
        </Animated.View>
      )}

      {/* ── Sort bar ── */}
      <View style={[styles.sortBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sortLabel, { color: colors.textMuted }]}>Trier par :</Text>
        {(['rating', 'newest'] as const).map((key) => (
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
              {key === 'rating' ? 'Note' : 'Nouveautés'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Salon list ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {sortedSalons.length > 0 ? (
          <View style={styles.listGrid}>
            {sortedSalons.map((salon, index) => (
              <Animated.View
                key={salon.id}
                entering={FadeInUp.delay(index * 80).duration(400)}
              >
                <SalonCard salon={salon} variant="default" />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun salon trouvé pour ce style actuellement.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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

  listGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 16,
  },

  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
