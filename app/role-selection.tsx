/**
 * Écran de sélection de rôle - AfroPlan
 * Design basé sur exe.jpeg
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const cardWidth = width - 48;

type UserRole = 'client' | 'coiffeur';

interface RoleCardProps {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  imageSource: any;
  onPress: () => void;
  delay: number;
}

function RoleCard({
  role,
  icon,
  label,
  subtitle,
  imageSource,
  onPress,
  delay,
}: RoleCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        style={styles.card}
      >
        {/* Background Image */}
        <Image
          source={imageSource}
          style={styles.cardImage}
          contentFit="cover"
          contentPosition="top"
        />

        {/* Overlay gradient - plus subtil en haut, plus sombre en bas */}
        <View style={styles.cardOverlayTop} />
        <View style={styles.cardOverlayBottom} />

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Badge icône */}
          <View style={styles.cardIconBadge}>
            <Ionicons name={icon} size={20} color="#FFFFFF" />
          </View>

          {/* Textes */}
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>

          {/* Bouton */}
          <View style={styles.cardButton}>
            <Text style={styles.cardButtonText}>
              {role === 'client' ? 'Commencer' : 'Accéder'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#191919" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'coiffeur') {
      router.replace('/(coiffeur)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header avec logo agrandi */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Text style={styles.tagline}>La coiffure afro, réinventée.</Text>
        </Animated.View>

        {/* Question Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          style={styles.questionSection}
        >
          <Text style={styles.questionTitle}>Choisissez votre espace</Text>
        </Animated.View>

        {/* Role Cards - empilées verticalement */}
        <View style={styles.cardsContainer}>
          <RoleCard
            role="client"
            icon="person-outline"
            label="Espace Client"
            subtitle="Trouve ton coiffeur afro et réserve en quelques clics"
            imageSource={require('@/assets/images/espace_client.jpg')}
            onPress={() => handleRoleSelect('client')}
            delay={400}
          />

          <RoleCard
            role="coiffeur"
            icon="cut-outline"
            label="Espace Coiffeur"
            subtitle="Gère tes rendez-vous et développe ton activité"
            imageSource={require('@/assets/images/espace_coiffeur.jpg')}
            onPress={() => handleRoleSelect('coiffeur')}
            delay={500}
          />
        </View>

        {/* Trust Section - remonté */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.trustSection}
        >
          <Text style={styles.trustText}>
            Déjà +100 coiffeurs nous font confiance.
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <Ionicons key={index} name="star" size={16} color="#191919" />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // ── Header & Logo ──
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 16 : 24,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: isSmallScreen ? 110 : 130,
    height: isSmallScreen ? 110 : 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#808080',
    marginTop: 0,
  },

  // ── Question ──
  questionSection: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 18 : 24,
    paddingHorizontal: 24,
    marginBottom: isSmallScreen ? 16 : 20,
  },
  questionTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#191919',
    textAlign: 'center',
  },

  // ── Cards ──
  cardsContainer: {
    paddingHorizontal: 24,
    gap: isSmallScreen ? 14 : 16,
  },
  cardWrapper: {
    width: cardWidth,
  },
  card: {
    height: isSmallScreen ? 190 : 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  cardOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
  },
  cardContent: {
    flex: 1,
    padding: isSmallScreen ? 18 : 22,
    justifyContent: 'flex-end',
  },
  cardIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: isSmallScreen ? 18 : 20,
    marginBottom: 14,
  },
  cardButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 6,
  },
  cardButtonText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '700',
    color: '#191919',
  },

  // ── Trust Section ──
  trustSection: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 18 : 24,
    paddingHorizontal: 24,
  },
  trustText: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#4A4A4A',
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
});
