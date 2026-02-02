/**
 * Theme et couleurs pour AfroPlan
 * Application de decouverte de salons de coiffure Afro
 */

import { Platform } from 'react-native';

// Couleurs principales AfroPlan
const primaryColor = '#8B4513'; // Brun Afro
const accentColor = '#DAA520'; // Or / Dore
const secondaryColor = '#2D1810'; // Brun fonce

export const Colors = {
  light: {
    // Couleurs de base
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F5F2',
    card: '#FFFFFF',
    border: '#E5E0DB',

    // Couleurs de marque
    primary: primaryColor,
    primaryLight: '#A65D2A',
    primaryDark: '#6B3410',
    accent: accentColor,
    accentLight: '#F0D88A',
    secondary: secondaryColor,

    // Couleurs fonctionnelles
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Navigation
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,

    // Composants specifiques
    inputBackground: '#F5F5F5',
    inputBorder: '#E0E0E0',
    placeholder: '#9CA3AF',
    divider: '#E5E0DB',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Rating stars
    starFilled: accentColor,
    starEmpty: '#D1D5DB',
  },
  dark: {
    // Couleurs de base
    text: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    card: '#252525',
    border: '#333333',

    // Couleurs de marque
    primary: '#C87137',
    primaryLight: '#D4894F',
    primaryDark: primaryColor,
    accent: accentColor,
    accentLight: '#F0D88A',
    secondary: '#4A3028',

    // Couleurs fonctionnelles
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Navigation
    tint: '#C87137',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#C87137',

    // Composants specifiques
    inputBackground: '#2A2A2A',
    inputBorder: '#404040',
    placeholder: '#6B7280',
    divider: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Rating stars
    starFilled: accentColor,
    starEmpty: '#4B5563',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Espacement
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Rayons de bordure
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Tailles de police
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

// Ombres
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
