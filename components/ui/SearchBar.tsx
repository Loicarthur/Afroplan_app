/**
 * Composant Barre de recherche
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
};

export function SearchBar({
  placeholder = 'Rechercher un salon...',
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onClear,
  autoFocus = false,
  showFilterButton = false,
  onFilterPress,
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  const currentValue = value !== undefined ? value : localValue;

  const handleChangeText = (text: string) => {
    if (value === undefined) {
      setLocalValue(text);
    }
    onChangeText?.(text);
  };

  const handleClear = () => {
    if (value === undefined) {
      setLocalValue('');
    }
    onChangeText?.('');
    onClear?.();
  };

  const handleSubmit = () => {
    onSubmit?.(currentValue);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: isFocused ? colors.primary : colors.inputBorder,
          },
          Shadows.sm,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.placeholder}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={currentValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {currentValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
      {showFilterButton && (
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={onFilterPress}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    height: 48,
  },
  searchIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
