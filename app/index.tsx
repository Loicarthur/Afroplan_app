/**
 * Point d'entree - Redirige selon l'etat d'authentification
 * Connecte → app directement | Pas connecte → splash/onboarding
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const ONBOARDING_DONE_KEY = '@afroplan_onboarding_done';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  // Attendre le chargement auth + onboarding check
  if (isLoading || onboardingDone === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  // Connecte → direction l'app selon le role
  if (isAuthenticated && profile) {
    if (profile.role === 'coiffeur') {
      return <Redirect href="/(coiffeur)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Pas connecte, premiere fois → splash (puis onboarding)
  if (!onboardingDone) {
    return <Redirect href="/splash" />;
  }

  // Pas connecte, onboarding deja vu → selection de role
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
