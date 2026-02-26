/**
 * Page de détails d'une catégorie de coiffure
 * Affiche tous les styles spécifiques (ex: Box Braids, Knotless) au sein d'une catégorie (ex: Tresses)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

export default function CategoryStylesScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Trouver la catégorie et ses styles
  const category = HAIRSTYLE_CATEGORIES.find(c => c.id === categoryId);

  if (!category) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.text }}>Catégorie introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, marginTop: 10 }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{category.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introBox}>
          <Text style={styles.introEmoji}>{category.emoji}</Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Choisissez le style précis que vous recherchez parmi nos suggestions de {category.title.toLowerCase()}.
          </Text>
        </View>

        <View style={styles.grid}>
          {category.styles.map((style, index) => (
            <Animated.View 
              key={style.id} 
              entering={FadeInUp.delay(index * 50).duration(400)}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={[styles.styleCard, { backgroundColor: colors.card }, Shadows.sm]}
                onPress={() => router.push({
                  pathname: '/style-salons/[styleId]',
                  params: { styleId: style.id, styleName: style.name }
                })}
              >
                <Image source={style.image} style={styles.styleImage} contentFit="cover" />
                <View style={styles.styleInfo}>
                  <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={2}>
                    {style.name}
                  </Text>
                  {style.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={[styles.durationText, { color: colors.textMuted }]}>{style.duration}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
  },
  introBox: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  introEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  introText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  styleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
  },
  styleImage: {
    width: '100%',
    height: 140,
  },
  styleInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  styleName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  durationText: {
    fontSize: 11,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
