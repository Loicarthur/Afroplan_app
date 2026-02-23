/**
 * Tests pour le theme et les constantes
 */

import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '@/constants/theme';

describe('Theme Constants', () => {
  describe('Colors', () => {
    it('has light and dark themes', () => {
      expect(Colors.light).toBeDefined();
      expect(Colors.dark).toBeDefined();
    });

    it('light theme has all required color keys', () => {
      const requiredKeys = [
        'text', 'textSecondary', 'background', 'card', 'border',
        'primary', 'accent', 'success', 'warning', 'error',
        'tint', 'icon', 'tabIconDefault', 'tabIconSelected',
      ];

      requiredKeys.forEach(key => {
        expect(Colors.light).toHaveProperty(key);
        expect(typeof (Colors.light as any)[key]).toBe('string');
      });
    });

    it('dark theme has all required color keys', () => {
      const requiredKeys = [
        'text', 'textSecondary', 'background', 'card', 'border',
        'primary', 'accent', 'success', 'warning', 'error',
        'tint', 'icon', 'tabIconDefault', 'tabIconSelected',
      ];

      requiredKeys.forEach(key => {
        expect(Colors.dark).toHaveProperty(key);
        expect(typeof (Colors.dark as any)[key]).toBe('string');
      });
    });

    it('uses correct AfroPlan brand colors', () => {
      expect(Colors.light.primary).toBe('#191919');
      expect(Colors.light.background).toBe('#f9f8f8');
      expect(Colors.dark.background).toBe('#191919');
    });

    it('has valid hex color format for all colors', () => {
      const hexOrRgbaRegex = /^(#[0-9A-Fa-f]{3,8}|rgba?\([\d,./ ]+\))$/;

      Object.values(Colors.light).forEach(color => {
        expect(color).toMatch(hexOrRgbaRegex);
      });

      Object.values(Colors.dark).forEach(color => {
        expect(color).toMatch(hexOrRgbaRegex);
      });
    });
  });

  describe('Spacing', () => {
    it('has increasing values', () => {
      expect(Spacing.xs).toBeLessThan(Spacing.sm);
      expect(Spacing.sm).toBeLessThan(Spacing.md);
      expect(Spacing.md).toBeLessThan(Spacing.lg);
      expect(Spacing.lg).toBeLessThan(Spacing.xl);
      expect(Spacing.xl).toBeLessThan(Spacing.xxl);
    });

    it('all values are positive numbers', () => {
      Object.values(Spacing).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('BorderRadius', () => {
    it('has increasing values', () => {
      expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
      expect(BorderRadius.md).toBeLessThan(BorderRadius.lg);
      expect(BorderRadius.lg).toBeLessThan(BorderRadius.xl);
    });

    it('full radius is very large for pill shapes', () => {
      expect(BorderRadius.full).toBeGreaterThanOrEqual(9999);
    });
  });

  describe('FontSizes', () => {
    it('has increasing values', () => {
      expect(FontSizes.xs).toBeLessThan(FontSizes.sm);
      expect(FontSizes.sm).toBeLessThan(FontSizes.md);
      expect(FontSizes.md).toBeLessThan(FontSizes.lg);
      expect(FontSizes.lg).toBeLessThan(FontSizes.xl);
    });
  });

  describe('Shadows', () => {
    it('has sm, md, lg shadow variants', () => {
      expect(Shadows.sm).toBeDefined();
      expect(Shadows.md).toBeDefined();
      expect(Shadows.lg).toBeDefined();
    });

    it('shadows have increasing elevation', () => {
      expect(Shadows.sm.elevation).toBeLessThan(Shadows.md.elevation);
      expect(Shadows.md.elevation).toBeLessThan(Shadows.lg.elevation);
    });

    it('shadows have required properties', () => {
      [Shadows.sm, Shadows.md, Shadows.lg].forEach(shadow => {
        expect(shadow).toHaveProperty('shadowColor');
        expect(shadow).toHaveProperty('shadowOffset');
        expect(shadow).toHaveProperty('shadowOpacity');
        expect(shadow).toHaveProperty('shadowRadius');
        expect(shadow).toHaveProperty('elevation');
      });
    });
  });
});
