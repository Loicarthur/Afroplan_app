/**
 * Composant Rating (etoiles)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type RatingProps = {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
};

export function Rating({
  value,
  maxValue = 5,
  size = 'md',
  showValue = false,
  showCount = false,
  count = 0,
  interactive = false,
  onChange,
}: RatingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStarSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 24;
      default:
        return 18;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return FontSizes.sm;
      case 'lg':
        return FontSizes.lg;
      default:
        return FontSizes.md;
    }
  };

  const starSize = getStarSize();

  const renderStar = (index: number) => {
    const filled = index < Math.floor(value);
    const halfFilled = index === Math.floor(value) && value % 1 >= 0.5;

    const iconName = filled
      ? 'star'
      : halfFilled
      ? 'star-half'
      : 'star-outline';

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
      <StarComponent
        key={index}
        onPress={interactive ? () => onChange?.(index + 1) : undefined}
        style={styles.star}
      >
        <Ionicons
          name={iconName}
          size={starSize}
          color={filled || halfFilled ? colors.starFilled : colors.starEmpty}
        />
      </StarComponent>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxValue }, (_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={[styles.value, { color: colors.text, fontSize: getTextSize() }]}>
          {value.toFixed(1)}
        </Text>
      )}
      {showCount && (
        <Text style={[styles.count, { color: colors.textSecondary, fontSize: getTextSize() - 2 }]}>
          ({count})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  value: {
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  count: {
    marginLeft: Spacing.xs,
  },
});
