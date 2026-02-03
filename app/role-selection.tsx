/**
 * Écran de sélection de rôle - AfroPlan
 * Permet à l'utilisateur de choisir son parcours (Client ou Coiffeur)
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

type UserRole = 'client' | 'coiffeur';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  delay: number;
}

function RoleCard({ role, title, description, icon, onPress, delay }: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isClient = role === 'client';

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(600).springify()}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.cardTouchable}
      >
        <View style={[styles.card, isClient ? styles.cardClient : styles.cardCoiffeur]}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, isClient ? styles.iconContainerClient : styles.iconContainerCoiffeur]}>
              <Ionicons name={icon} size={isSmallScreen ? 36 : 44} color="#191919" />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward-circle" size={28} color="#191919" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = async (role: UserRole) => {
    // Naviguer vers l'écran de bienvenue avec le rôle sélectionné
    router.replace({
      pathname: '/welcome',
      params: { role }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header avec logo */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo_afroplan.jpeg')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.welcomeText}>Bienvenue sur</Text>
        <Text style={styles.brandName}>AfroPlan</Text>
        <Text style={styles.subtitle}>Choisissez votre profil pour commencer</Text>
      </Animated.View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        <RoleCard
          role="client"
          title="Je suis Client"
          description="Découvrez les meilleurs salons de coiffure afro près de chez vous et réservez en quelques clics"
          icon="person"
          onPress={() => handleRoleSelect('client')}
          delay={400}
        />

        <RoleCard
          role="coiffeur"
          title="Je suis Coiffeur"
          description="Gérez votre salon, vos rendez-vous et développez votre clientèle avec AfroPlan Pro"
          icon="cut"
          onPress={() => handleRoleSelect('coiffeur')}
          delay={600}
        />
      </View>

      {/* Footer */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
      >
        <Text style={styles.footerText}>
          Vous pourrez toujours changer de rôle plus tard
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f8f8',
  },
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 20 : 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: isSmallScreen ? 40 : 50,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#808080',
    fontWeight: '400',
  },
  brandName: {
    fontSize: isSmallScreen ? 32 : 38,
    color: '#191919',
    fontWeight: '700',
    letterSpacing: 1,
    marginVertical: 6,
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 15,
    color: '#808080',
    textAlign: 'center',
    marginTop: 6,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: isSmallScreen ? 16 : 20,
  },
  cardWrapper: {
    width: '100%',
  },
  cardTouchable: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    padding: isSmallScreen ? 20 : 24,
    minHeight: isSmallScreen ? 140 : 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#191919',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardClient: {
    borderColor: '#191919',
  },
  cardCoiffeur: {
    borderColor: '#4A4A4A',
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: isSmallScreen ? 60 : 70,
    height: isSmallScreen ? 60 : 70,
    borderRadius: isSmallScreen ? 30 : 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  iconContainerClient: {
    backgroundColor: '#F0F0F0',
  },
  iconContainerCoiffeur: {
    backgroundColor: '#E5E5E5',
  },
  cardTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#191919',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#4A4A4A',
    lineHeight: isSmallScreen ? 18 : 20,
    paddingRight: 40,
  },
  arrowContainer: {
    position: 'absolute',
    right: 0,
    top: isSmallScreen ? 16 : 20,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#808080',
    textAlign: 'center',
  },
});
