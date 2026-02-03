/**
 * Écran de bienvenue/consentement - AfroPlan
 * S'affiche après la sélection du rôle (comme p2)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SELECTED_ROLE_KEY = '@afroplan_selected_role';
const WELCOME_ACCEPTED_KEY = '@afroplan_welcome_accepted';

type UserRole = 'client' | 'coiffeur';

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}

function FeatureItem({ icon, title, description, delay }: FeatureItemProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400)}
      style={styles.featureItem}
    >
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color="#191919" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>
          {title.split(' ').map((word, i) =>
            word === 'performante' || word === 'optimisée' || word === 'sûre' ||
            word === 'offres' || word === 'contenus' || word === 'personnalisés'
              ? <Text key={i} style={styles.featureTitleBold}>{word} </Text>
              : `${word} `
          )}
        </Text>
        {description && (
          <Text style={styles.featureDescription}>{description}</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role as UserRole) || 'client';

  const handleAccept = async () => {
    // Stocker que l'utilisateur a accepté
    await AsyncStorage.setItem(WELCOME_ACCEPTED_KEY, 'true');
    await AsyncStorage.setItem(SELECTED_ROLE_KEY, role);

    // Rediriger vers la page appropriée
    if (role === 'coiffeur') {
      router.replace('/(coiffeur)');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSettings = () => {
    // Pour l'instant, on peut juste accepter
    handleAccept();
  };

  const handleContinueWithout = () => {
    handleAccept();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background semi-transparent */}
      <View style={styles.background} />

      {/* Modal Card */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.modalContainer}
      >
        <View style={styles.modalCard}>
          {/* Titre */}
          <Animated.Text
            entering={FadeInUp.delay(100).duration(400)}
            style={styles.modalTitle}
          >
            Bienvenue sur AfroPlan !
          </Animated.Text>

          {/* Sous-titre */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.subtitleContainer}
          >
            <Text style={styles.modalSubtitle}>
              Nous nous engageons à vous offrir
            </Text>
            <Text style={styles.emoji}>👇</Text>
          </Animated.View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="flash"
              title="Une app performante"
              description=""
              delay={300}
            />
            <FeatureItem
              icon="shield-checkmark"
              title="Une expérience optimisée et plus sûre"
              description=""
              delay={400}
            />
            <FeatureItem
              icon="gift"
              title="Des offres et des contenus personnalisés"
              description=""
              delay={500}
            />
          </View>

          {/* Note */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(400)}
            style={styles.noteContainer}
          >
            <View style={styles.divider} />
            <Text style={styles.noteText}>
              Vous pouvez modifier vos préférences à tout moment dans les paramètres.
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View
            entering={FadeInUp.delay(700).duration(400)}
            style={styles.buttonsContainer}
          >
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettings}
            >
              <Text style={styles.settingsButtonText}>Paramétrer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Tout accepter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueWithout}
            >
              <Text style={styles.continueButtonText}>Continuer sans accepter</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 25, 25, 0.85)', // Noir avec opacité
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191919',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#4A4A4A',
    textAlign: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  featuresContainer: {
    gap: 20,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
    paddingTop: 10,
  },
  featureTitle: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
  },
  featureTitleBold: {
    fontWeight: '700',
    color: '#191919',
  },
  featureDescription: {
    fontSize: 13,
    color: '#808080',
    marginTop: 2,
  },
  noteContainer: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginBottom: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonsContainer: {
    gap: 12,
  },
  settingsButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
  },
  acceptButton: {
    backgroundColor: '#191919',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191919',
  },
});
