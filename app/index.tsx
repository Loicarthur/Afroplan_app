/**
 * Point d'entrée - Redirige selon l'état d'authentification
 * Connecté → app selon rôle | Pas connecté → login
 */

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#191919" />
      </View>
    );
  }

  // Connecté → direction l'app selon le rôle
  if (isAuthenticated && profile) {
    if (profile.role === 'coiffeur') {
      return <Redirect href="/(coiffeur)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Pas connecté → onboarding
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
