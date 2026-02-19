/**
 * Point d'entrée - Redirige selon l'état d'authentification ou le rôle choisi
 * Connecté → app selon rôle | Pas connecté mais rôle choisi → app guest | Sinon → onboarding
 */

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

const SELECTED_ROLE_KEY = '@afroplan_selected_role';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_ROLE_KEY).then((role) => {
      setSelectedRole(role);
      setRoleLoaded(true);
    });
  }, []);

  // Cacher le splash screen uniquement quand auth ET role sont chargés
  useEffect(() => {
    if (!isLoading && roleLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, roleLoaded]);

  if (isLoading || !roleLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  // Connecté → direction l'app selon le rôle
  if (isAuthenticated) {
    // Profil pas encore chargé (chargement asynchrone post-auth)
    if (!profile) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#191919" />
        </View>
      );
    }
    if (profile.role === 'coiffeur') {
      return <Redirect href="/(coiffeur)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Pas connecté mais rôle choisi → accès guest à l'app
  if (selectedRole === 'coiffeur') {
    return <Redirect href="/(coiffeur)" />;
  }
  if (selectedRole === 'client') {
    return <Redirect href="/(tabs)" />;
  }

  // Aucun rôle choisi → onboarding
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f8f8',
  },
});
