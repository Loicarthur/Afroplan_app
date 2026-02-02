/**
 * Splash Screen - Afro'Planet
 * Écran de bienvenue avec logo animé (effet heartbeat)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const navigateToApp = () => {
    router.replace('/(tabs)');
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

    // Navigation après 5 secondes
    const timer = setTimeout(() => {
      navigateToApp();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <LinearGradient
      colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Logo animé */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoBackground}>
            <Image
              source={require('@/assets/images/logo_afro.jpeg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Texte de bienvenue */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.welcomeText}>Bienvenue sur</Text>
          <Text style={styles.brandName}>Afro'Planet</Text>
          <Text style={styles.tagline}>Trouvez votre style parfait</Text>
        </Animated.View>
      </View>

      {/* Indicateur de chargement */}
      <Animated.View style={[styles.footer, textAnimatedStyle]}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </Animated.View>
    </LinearGradient>
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
  container: {
    flex: 1,
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 42,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: '#FFFFFF',
  },
});
