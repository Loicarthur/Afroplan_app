/**
 * Theme et couleurs pour AfroPlan
 * Application de decouverte de salons de coiffure Afro
 */

import { Platform } from 'react-native';

// Couleurs principales AfroPlan - Design violet/magenta
const primaryColor = '#8B5CF6'; // Violet principal
const accentColor = '#F97316'; // Orange accent
const secondaryColor = '#7C3AED'; // Violet foncé

export const Colors = {
  light: {
    // Couleurs de base
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F8F8',
    card: '#FFFFFF',
    border: '#E5E5E5',

    // Couleurs de marque
    primary: primaryColor,
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    accent: accentColor,
    accentLight: '#FB923C',
    secondary: secondaryColor,

    // Gradient colors
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',

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
    divider: '#E5E5E5',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Rating stars
    starFilled: '#FBBF24',
    starEmpty: '#D1D5DB',

    // Category badges
    badgeBraids: '#8B5CF6',
    badgeNatural: '#F97316',
    badgeTwists: '#EC4899',
    badgeLocs: '#22C55E',
    badgeWeave: '#3B82F6',
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
    primary: '#A78BFA',
    primaryLight: '#C4B5FD',
    primaryDark: primaryColor,
    accent: accentColor,
    accentLight: '#FB923C',
    secondary: '#8B5CF6',

    // Gradient colors
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',

    // Couleurs fonctionnelles
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Navigation
    tint: '#A78BFA',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#A78BFA',

    // Composants specifiques
    inputBackground: '#2A2A2A',
    inputBorder: '#404040',
    placeholder: '#6B7280',
    divider: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Rating stars
    starFilled: '#FBBF24',
    starEmpty: '#4B5563',

    // Category badges
    badgeBraids: '#A78BFA',
    badgeNatural: '#FB923C',
    badgeTwists: '#F472B6',
    badgeLocs: '#34D399',
    badgeWeave: '#60A5FA',
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
