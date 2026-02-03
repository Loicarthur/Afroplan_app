/**
 * Écran de bienvenue/consentement - AfroPlan
 * S'affiche après la sélection du rôle (comme p2)
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background semi-transparent */}
      <View style={styles.background} />

      {/* Onboarding carousel */}
      <View style={styles.carouselWrapper}>
        <OnboardingInline />
      </View>
    </View>
  );
}

function OnboardingInline() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { width } = Dimensions.get('window');
  const SLIDES = [
    require('@/assets/images/p1.png'),
    require('@/assets/images/p2.png'),
    require('@/assets/images/p3.png'),
  ];
  const FINAL = require('@/assets/images/exe.jpeg');

  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index === SLIDES.length) {
      const t = setTimeout(() => router.replace('/role-selection'), 500);
      return () => clearTimeout(t);
    }
  }, [index]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    setIndex(i);
  };

  const goToSlide = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((img, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Image source={img} style={styles.slideImage} />
          </View>
        ))}
        <View key="final" style={[styles.slide, { width }]}>
          <Image source={FINAL} style={styles.slideImage} />
        </View>
      </ScrollView>

      {index < SLIDES.length && (
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
                <View style={[styles.dot, { backgroundColor: active ? theme.primary : theme.placeholder, opacity: active ? 1 : 0.45 }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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

  /* Onboarding / Carousel styles */
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    width: '100%',
    height: 420,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 420,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
});
