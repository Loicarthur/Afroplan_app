/**
 * Page Avis Salon - AfroPlan
 * Affichage des avis clients
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

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    clientName: 'Marie D.',
    rating: 5,
    comment: 'Excellent travail ! Les tresses sont magnifiques et bien faites. Je recommande vivement.',
    date: '2025-01-15',
    service: 'Tresses africaines',
  },
  {
    id: '2',
    clientName: 'Fatou D.',
    rating: 4,
    comment: 'Tres bon service, salon propre et accueillant. Un peu d\'attente mais le resultat en vaut la peine.',
    date: '2025-01-12',
    service: 'Locks entretien',
  },
  {
    id: '3',
    clientName: 'Aminata B.',
    rating: 5,
    comment: 'Professionnelle et a l\'ecoute. Le resultat est exactement ce que je voulais !',
    date: '2025-01-10',
    service: 'Coupe + Coloration',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const averageRating = MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Avis clients</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }, Shadows.sm]}>
          <Text style={[styles.averageScore, { color: colors.text }]}>
            {averageRating.toFixed(1)}
          </Text>
          <StarRating rating={Math.round(averageRating)} />
          <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
            {MOCK_REVIEWS.length} avis
          </Text>
        </View>

        {/* Reviews List */}
        {MOCK_REVIEWS.map((review) => (
          <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {review.clientName.charAt(0)}
                </Text>
              </View>
              <View style={styles.reviewInfo}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {review.clientName}
                </Text>
                <StarRating rating={review.rating} />
              </View>
              <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                {review.date}
              </Text>
            </View>
            <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
              {review.comment}
            </Text>
            <View style={[styles.serviceBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="cut-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.serviceText, { color: colors.textMuted }]}>
                {review.service}
              </Text>
            </View>
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
  averageScore: {
    fontSize: 40,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  reviewCount: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  reviewCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  clientName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: FontSizes.xs,
  },
  reviewComment: {
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: 4,
  },
  serviceText: {
    fontSize: FontSizes.xs,
  },
});
