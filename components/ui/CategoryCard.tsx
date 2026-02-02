/**
 * Composant Carte de Categorie
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Category } from '@/types';

type CategoryCardProps = {
  category: Category;
  onPress: (category: Category) => void;
  variant?: 'default' | 'compact';
};

// Mapping des icones par defaut pour les categories
const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'tresses': 'git-branch-outline',
  'locks': 'infinite-outline',
  'coupe': 'cut-outline',
  'coloration': 'color-palette-outline',
  'soin': 'heart-outline',
  'lissage': 'water-outline',
  'extensions': 'sparkles-outline',
  'barber': 'man-outline',
  'enfant': 'happy-outline',
  'mariage': 'diamond-outline',
  'default': 'sparkles-outline',
};

export function CategoryCard({ category, onPress, variant = 'default' }: CategoryCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (category.icon) {
      return category.icon as keyof typeof Ionicons.glyphMap;
    }
    return categoryIcons[category.slug] || categoryIcons['default'];
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => onPress(category)}
        activeOpacity={0.7}
      >
        <View style={[styles.compactIconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name={getIconName()} size={20} color="#FFFFFF" />
        </View>
        <Text
          style={[styles.compactName, { color: colors.text }]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      {category.image_url ? (
        <Image
          source={{ uri: category.image_url }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.iconPlaceholder, { backgroundColor: colors.primary }]}>
          <Ionicons name={getIconName()} size={32} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.name}>{category.name}</Text>
        {category.description && (
          <Text style={styles.description} numberOfLines={2}>
            {category.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },

  // Compact variant
  compactCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  compactName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
