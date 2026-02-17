/**
 * Bannière d'environnement - AfroPlan
 * Affiche un badge discret en haut de l'écran pour identifier
 * l'environnement (development / preview). Masquée en production.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { config, AppEnvironment } from '@/lib/config';

const ENV_COLORS: Record<AppEnvironment, { bg: string; text: string }> = {
  development: { bg: '#F59E0B', text: '#000000' },
  preview: { bg: '#8B5CF6', text: '#FFFFFF' },
  production: { bg: 'transparent', text: 'transparent' },
};

export default function EnvironmentBanner() {
  if (!config.showEnvBanner) return null;

  const colors = ENV_COLORS[config.env];
  const label = config.isDev ? 'DEV' : 'PREVIEW';

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 9999,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
