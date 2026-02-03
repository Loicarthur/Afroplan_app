/**
 * Onboarding Screen - AfroPlan
 * Carousel avec p1, p2, p3 - Navigation par touch/swipe
 * Pas de bouton "Commencer" - juste toucher l'écran
 * Charte graphique: Noir #191919, Blanc #f9f8f8
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ImageBackground,
  FlatList,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Données des slides onboarding
const ONBOARDING_SLIDES = [
  {
    id: '1',
    image: require('@/assets/images/afro2.jpg'),
    title: 'Des coiffeurs passionnés',
    subtitle: 'Spécialistes des cheveux afro près de chez toi',
  },
  {
    id: '2',
    image: require('@/assets/images/afro2.jpg'),
    title: 'Trouve ton style parfait',
    subtitle: 'Des centaines de coiffures afro à portée de main',
  },
  {
    id: '3',
    image: require('@/assets/images/afro2.jpg'),
    title: 'Réserve en quelques clics',
    subtitle: 'Simple, rapide et sans stress',
  },
];

interface SlideProps {
  item: typeof ONBOARDING_SLIDES[0];
  index: number;
}

function Slide({ item, index }: SlideProps) {
  return (
    <View style={styles.slide}>
      <Image
        source={item.image}
        style={styles.slideImage}
        contentFit="cover"
      />
      {/* Overlay gradient */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.slideContent}>
        {/* Logo en haut */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo_afroplan.jpeg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.brandName}>AfroPlan</Text>
        </View>

        {/* Texte en bas */}
        <View style={styles.textSection}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

// Composant Dot pour pagination
function PaginationDot({ active }: { active: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 200 }),
    opacity: withTiming(active ? 1 : 0.5, { duration: 200 }),
    backgroundColor: '#FFFFFF',
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const pulseOpacity = useSharedValue(0.5);

  // Animation du texte "Touchez l'écran"
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Callback pour tracker la slide visible
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Navigation au touch
  const handlePress = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      // Passer au slide suivant
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Dernier slide -> aller à la sélection de rôle
      router.replace('/role-selection');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={({ item, index }) => <Slide item={item} index={index} />}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
        />

        {/* Pagination dots */}
        <View style={[styles.pagination, { bottom: insets.bottom + 80 }]}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <PaginationDot key={index} active={index === currentIndex} />
          ))}
        </View>

        {/* Touch indicator */}
        <Animated.View
          style={[
            styles.touchIndicator,
            { bottom: insets.bottom + 40 },
            pulseStyle
          ]}
        >
          <Text style={styles.touchText}>Touchez l'écran pour continuer</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191919',
  },
  slide: {
    width,
    height,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 160,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  textSection: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  touchIndicator: {
    position: 'absolute',
    alignSelf: 'center',
  },
  touchText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
});
