/**
 * Point d'entrée - Redirige selon l'état d'authentification
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = '@afroplan_onboarding_done';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  // En attente du chargement auth + onboarding check
  if (isLoading || onboardingDone === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  // Utilisateur connecté → direction l'app
  if (isAuthenticated && profile) {
    if (profile.role === 'coiffeur') {
      return <Redirect href="/(coiffeur)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Première fois → onboarding
  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  // Pas connecté mais a déjà vu l'onboarding → sélection de rôle
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
