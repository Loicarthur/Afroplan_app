/**
 * Splash Screen - AfroPlan
 * Écran de bienvenue avec logo animé (effet heartbeat)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigated = useRef(false);

  const navigateToApp = () => {
    // Éviter la double navigation
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // Annuler le timer si encore actif
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Annuler les animations
    cancelAnimation(scale);

    router.replace('/role-selection');
  };

  useEffect(() => {
    // Fade in du logo
    opacity.value = withTiming(1, { duration: 500 });

    // Animation heartbeat - pulse comme un coeur
    scale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          // Premier battement (plus fort)
          withTiming(1.15, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
          // Deuxième battement (plus léger)
          withTiming(1.08, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
          // Pause entre les battements
          withTiming(1, { duration: 400 })
        ),
        -1, // Répéter indéfiniment
        false
      )
    );

    // Fade in du texte après 1 seconde
    textOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 800 })
    );

    // Navigation après 10 secondes
    timerRef.current = setTimeout(() => {
      navigateToApp();
    }, 10000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Pressable style={styles.pressable} onPress={navigateToApp}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Logo animé */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoBackground}>
              <Image
                source={require('@/assets/images/logo_afroplan.jpeg')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          {/* Texte de bienvenue */}
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <Text style={styles.welcomeText}>Bienvenue sur</Text>
            <Text style={styles.brandName}>AfroPlan</Text>
            <Text style={styles.tagline}>Trouvez votre style parfait</Text>
          </Animated.View>
        </View>

        {/* Indicateur - toucher pour continuer */}
        <Animated.View style={[styles.footer, textAnimatedStyle]}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
          <Text style={styles.skipText}>Touchez l'écran pour continuer</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

// Composant pour les points de chargement animés
function LoadingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f8f8', // Blanc charte graphique
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#4A4A4A', // Gris foncé
    fontWeight: '400',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 42,
    color: '#191919', // Noir charte graphique
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#808080', // Gris
    fontWeight: '400',
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#191919', // Noir charte graphique
  },
  skipText: {
    color: '#808080', // Gris
    fontSize: 14,
    marginTop: 20,
    fontWeight: '400',
  },
});
