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
  const [profileTimeout, setProfileTimeout] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_ROLE_KEY).then((role) => {
      setSelectedRole(role);
      setRoleLoaded(true);
    });
  }, []);

  // Sécurité: Si le profil met trop de temps à charger alors qu'on est authentifié
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthenticated && !profile && !isLoading) {
      timer = setTimeout(() => {
        setProfileTimeout(true);
      }, 5000); // 5 secondes max
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated, profile, isLoading]);

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

  // Connecté → direction l'app selon le choix manuel de l'utilisateur (Priorité au Switch)
  if (isAuthenticated) {
    if (!profile) {
      // Si timeout atteint, on tente de rediriger quand même vers (tabs) en mode dégradé
      if (profileTimeout) {
        return <Redirect href="/(tabs)" />;
      }
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#191919" />
        </View>
      );
    }
    
    // On utilise le rôle sauvegardé localement par le bouton "Switch"
    // Si aucun choix n'a été fait, on prend le rôle par défaut du profil
    const roleToUse = selectedRole || profile.role;

    if (roleToUse === 'coiffeur') {
      return <Redirect href="/(coiffeur)" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Pas connecté mais rôle choisi précédemment
  if (selectedRole === 'coiffeur') {
    // Un coiffeur doit être connecté pour gérer son salon, sinon redirection inscription
    return <Redirect href="/(coiffeur)" />; 
  }
  
  if (selectedRole === 'client') {
    // Un client peut naviguer en mode guest (explorer)
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
