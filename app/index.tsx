/**
 * Point d'entrée - Redirige selon l'état d'onboarding
 * L'accueil est accessible sans connexion
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = '@afroplan_onboarding_done';

export default function Index() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  if (onboardingDone === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  // Première fois → splash (puis onboarding)
  if (!onboardingDone) {
    return <Redirect href="/splash" />;
  }

  // Sinon → sélection de rôle
  return <Redirect href="/role-selection" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f8f8',
  },
});
