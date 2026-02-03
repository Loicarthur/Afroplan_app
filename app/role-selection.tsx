/**
 * Écran de sélection de rôle - AfroPlan
 * Permet à l'utilisateur de choisir son parcours (Client ou Coiffeur)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState } from 'react';
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
  withTiming,
  FadeInUp,
  FadeInDown,
  interpolateColor,
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
  isSelected: boolean;
  onSelect: () => void;
}

function RoleCard({ role, title, description, icon, onPress, delay, isSelected, onSelect }: RoleCardProps) {
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  // Animation quand sélectionné
  React.useEffect(() => {
    colorProgress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#FFFFFF', '#191919']
    ),
    borderColor: '#191919',
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#191919', '#FFFFFF']
    ),
  }));

  const animatedDescStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#4A4A4A', '#E5E5E5']
    ),
  }));

  const animatedIconBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#F0F0F0', '#FFFFFF']
    ),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
    onSelect();
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
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <View style={styles.cardContent}>
            <Animated.View style={[styles.iconContainer, animatedIconBgStyle]}>
              <Ionicons name={icon} size={isSmallScreen ? 36 : 44} color="#191919" />
            </Animated.View>
            <Animated.Text style={[styles.cardTitle, animatedTextStyle]}>{title}</Animated.Text>
            <Animated.Text style={[styles.cardDescription, animatedDescStyle]}>{description}</Animated.Text>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward-circle" size={28} color={isSelected ? "#FFFFFF" : "#191919"} />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = async (role: UserRole) => {
    // Naviguer vers l'écran de bienvenue avec le rôle sélectionné
    router.replace({
      pathname: '/welcome',
      params: { role }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
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
          isSelected={selectedRole === 'client'}
          onSelect={() => setSelectedRole('client')}
        />

        <RoleCard
          role="coiffeur"
          title="Je suis Coiffeur"
          description="Gérez votre salon, vos rendez-vous et développez votre clientèle avec AfroPlan Pro"
          icon="cut"
          onPress={() => handleRoleSelect('coiffeur')}
          delay={600}
          isSelected={selectedRole === 'coiffeur'}
          onSelect={() => setSelectedRole('coiffeur')}
        />
      </View>
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
    borderColor: '#191919',
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
    backgroundColor: '#F0F0F0',
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
});
