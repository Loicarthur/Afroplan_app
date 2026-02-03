/**
 * Theme et couleurs pour AfroPlan
 * Application de decouverte de salons de coiffure Afro
 *
 * Charte graphique officielle:
 * - Noir profond: #191919 (RVB: 25,25,25) - Puissance, fierté, raffinement
 * - Blanc: #f9f8f8 (RVB: 249,248,248) - Équilibre, pureté, ouverture
 * - Gris clair: #E5E5E5 - Neutralité, stabilité, modernité
 */

import { Platform } from 'react-native';

// Couleurs principales AfroPlan - Charte graphique officielle
const primaryColor = '#191919'; // Noir profond - couleur principale
const accentColor = '#191919'; // Noir pour l'accent aussi
const secondaryColor = '#4A4A4A'; // Gris foncé pour le secondaire

export const Colors = {
  light: {
    // Couleurs de base - Charte graphique
    text: '#191919',
    textSecondary: '#4A4A4A',
    textMuted: '#808080',
    background: '#f9f8f8',
    backgroundSecondary: '#F0F0F0',
    card: '#FFFFFF',
    border: '#E5E5E5',

    // Couleurs de marque - Charte graphique
    primary: primaryColor,
    primaryLight: '#4A4A4A',
    primaryDark: '#000000',
    accent: accentColor,
    accentLight: '#4A4A4A',
    secondary: secondaryColor,

    // Gradient colors - Noir/Gris
    gradientStart: '#191919',
    gradientEnd: '#4A4A4A',

    // Couleurs fonctionnelles
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#191919',

    // Navigation
    tint: primaryColor,
    icon: '#4A4A4A',
    tabIconDefault: '#808080',
    tabIconSelected: primaryColor,

    // Composants specifiques
    inputBackground: '#F5F5F5',
    inputBorder: '#E5E5E5',
    placeholder: '#808080',
    divider: '#E5E5E5',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Rating stars
    starFilled: '#191919',
    starEmpty: '#E5E5E5',

    // Category badges - Noir et gris
    badgeBraids: '#191919',
    badgeNatural: '#4A4A4A',
    badgeTwists: '#191919',
    badgeLocs: '#4A4A4A',
    badgeWeave: '#191919',
  },
  dark: {
    // Couleurs de base - Mode sombre
    text: '#f9f8f8',
    textSecondary: '#C0C0C0',
    textMuted: '#808080',
    background: '#191919',
    backgroundSecondary: '#252525',
    card: '#2A2A2A',
    border: '#404040',

    // Couleurs de marque
    primary: '#f9f8f8',
    primaryLight: '#FFFFFF',
    primaryDark: '#E5E5E5',
    accent: '#f9f8f8',
    accentLight: '#FFFFFF',
    secondary: '#C0C0C0',

    // Gradient colors
    gradientStart: '#2A2A2A',
    gradientEnd: '#191919',

    // Couleurs fonctionnelles
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#f9f8f8',

    // Navigation
    tint: '#f9f8f8',
    icon: '#C0C0C0',
    tabIconDefault: '#808080',
    tabIconSelected: '#f9f8f8',

    // Composants specifiques
    inputBackground: '#2A2A2A',
    inputBorder: '#404040',
    placeholder: '#808080',
    divider: '#404040',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Rating stars
    starFilled: '#f9f8f8',
    starEmpty: '#404040',

    // Category badges
    badgeBraids: '#f9f8f8',
    badgeNatural: '#C0C0C0',
    badgeTwists: '#f9f8f8',
    badgeLocs: '#C0C0C0',
    badgeWeave: '#f9f8f8',
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
