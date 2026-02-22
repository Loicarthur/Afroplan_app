/**
 * Styles de Coiffure AfroPlan
 * Hierarchie: Grand titre = catégorie / Sous-titre = style spécifique
 * Cliquer sur un style → coiffeurs à proximité spécialisés
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const { width } = Dimensions.get('window');
const STYLE_CARD_WIDTH = (width - 52) / 2;

export default function StylesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    HAIRSTYLE_CATEGORIES[0]?.id ?? null
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleStylePress = (styleId: string, styleName: string) => {
    router.push({
      pathname: '/style-salons/[styleId]',
      params: { styleId, styleName },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Styles de coiffure</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choisissez un style pour trouver le bon coiffeur
        </Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {HAIRSTYLE_CATEGORIES.map((category, catIndex) => {
          const isExpanded = expandedCategory === category.id;

          return (
            <Animated.View
              key={category.id}
              entering={FadeInUp.delay(catIndex * 60).duration(400)}
              style={[styles.categorySection, { backgroundColor: colors.card }]}
            >
              {/* Category header — tap to expand/collapse */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.categoryColorDot,
                      { backgroundColor: category.color + '22' },
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  </View>
                  <View style={styles.categoryTitleBlock}>
                    <Text style={[styles.categoryNumber, { color: colors.textMuted }]}>
                      {category.number}
                    </Text>
                    <Text
                      style={[styles.categoryTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {category.title}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                      {category.styles.length} style{category.styles.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {/* Sub-styles grid — visible when expanded */}
              {isExpanded && (
                <View style={styles.stylesGrid}>
                  {category.styles.map((style) => (
                    <TouchableOpacity
                      key={style.id}
                      style={[styles.styleCard, { backgroundColor: colors.background }]}
                      onPress={() => handleStylePress(style.id, style.name)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.styleImageWrapper}>
                        <Image
                          source={{ uri: style.image }}
                          style={styles.styleImage}
                          contentFit="cover"
                        />
                        {/* Colored overlay stripe */}
                        <View
                          style={[styles.styleColorBar, { backgroundColor: category.color }]}
                        />
                        {/* Arrow CTA */}
                        <View style={[styles.styleArrow, { backgroundColor: category.color }]}>
                          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.styleInfo}>
                        <Text
                          style={[styles.styleName, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {style.name}
                        </Text>
                        {style.duration && (
                          <View style={styles.styleDurationRow}>
                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                            <Text style={[styles.styleDuration, { color: colors.textMuted }]}>
                              {style.duration}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Collapsed preview — show 3 style names */}
              {!isExpanded && (
                <View style={styles.collapsedPreview}>
                  {category.styles.slice(0, 3).map((s, i) => (
                    <View
                      key={s.id}
                      style={[
                        styles.collapsedTag,
                        { backgroundColor: category.color + '15', borderColor: category.color + '40' },
                      ]}
                    >
                      <Text style={[styles.collapsedTagText, { color: category.color }]}>
                        {s.name}
                      </Text>
                    </View>
                  ))}
                  {category.styles.length > 3 && (
                    <View
                      style={[
                        styles.collapsedTag,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.collapsedTagText, { color: colors.textMuted }]}>
                        +{category.styles.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* Bottom padding */}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Category card
  categorySection: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryColorDot: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryTitleBlock: {
    flex: 1,
  },
  categoryNumber: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  categoryCount: {
    fontSize: 11,
    marginTop: 2,
  },

  // Collapsed preview tags
  collapsedPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  collapsedTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  collapsedTagText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Style cards grid
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 10,
  },
  styleCard: {
    width: STYLE_CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  styleImageWrapper: {
    position: 'relative',
    height: 130,
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleColorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  styleArrow: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleInfo: {
    padding: 10,
  },
  styleName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 17,
  },
  stylePrice: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  styleDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  styleDuration: {
    fontSize: 11,
  },
});
