/**
 * Écran de sélection de rôle - AfroPlan
 * Permet à l'utilisateur de choisir son parcours (Client ou Coiffeur)
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const SELECTED_ROLE_KEY = '@afroplan_selected_role';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  onPress: () => void;
  delay: number;
}

function RoleCard({ role, title, description, icon, gradient, onPress, delay }: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

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
        <LinearGradient
          colors={gradient}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={isSmallScreen ? 48 : 56} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = async (role: UserRole) => {
    // Stocker le rôle sélectionné
    await AsyncStorage.setItem(SELECTED_ROLE_KEY, role);

    // Rediriger vers l'écran de connexion avec le rôle en paramètre
    router.replace({
      pathname: '/(auth)/login',
      params: { role }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.header}
      >
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
          gradient={['#8B5CF6', '#7C3AED', '#6D28D9']}
          onPress={() => handleRoleSelect('client')}
          delay={400}
        />

        <RoleCard
          role="coiffeur"
          title="Je suis Coiffeur"
          description="Gérez votre salon, vos rendez-vous et développez votre clientèle avec AfroPlan Pro"
          icon="cut"
          gradient={['#F97316', '#EA580C', '#C2410C']}
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
  },
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 20 : 40,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  brandName: {
    fontSize: isSmallScreen ? 36 : 42,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    marginVertical: 8,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: isSmallScreen ? 16 : 24,
  },
  cardWrapper: {
    width: '100%',
  },
  cardTouchable: {
    width: '100%',
  },
  card: {
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 24,
    minHeight: isSmallScreen ? 150 : 180,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 35 : 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: isSmallScreen ? 18 : 20,
    paddingRight: 40,
  },
  arrowContainer: {
    position: 'absolute',
    right: 0,
    top: isSmallScreen ? 20 : 24,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
