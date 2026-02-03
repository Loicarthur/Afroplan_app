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
  ImageBackground,
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
const cardWidth = (width - 48 - 12) / 2;

type UserRole = 'client' | 'coiffeur';

interface RoleCardProps {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string[];
  buttonText: string;
  imageSource: any;
  onPress: () => void;
  delay: number;
}

function RoleCard({
  role,
  title,
  subtitle,
  description,
  buttonText,
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
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.card}
      >
        {/* Background Image */}
        <Image
          source={imageSource}
          style={styles.cardImage}
          contentFit="cover"
        />

        {/* Overlay gradient */}
        <View style={styles.cardOverlay} />

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTextSection}>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
            {description.map((line, index) => (
              <Text key={index} style={styles.cardDescription}>{line}</Text>
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity style={styles.cardButton} onPress={onPress}>
            <Text style={styles.cardButtonText}>{buttonText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#191919" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role: UserRole) => {
    router.replace({
      pathname: '/welcome',
      params: { role }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header avec logo */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.header}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo_afroplan.jpeg')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          {/* Brand Name */}
          <Text style={styles.brandName}>AfroPlan</Text>
          <Text style={styles.tagline}>La coiffure afro, réinventée.</Text>
        </Animated.View>

        {/* Question Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          style={styles.questionSection}
        >
          <Text style={styles.questionTitle}>Qui êtes-vous aujourd'hui ?</Text>
          <Text style={styles.questionSubtitle}>
            Une expérience pensée pour chaque besoin.
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          <RoleCard
            role="client"
            title="Je veux"
            subtitle="me faire coiffer"
            description={[
              "Trouve le coiffeur afro",
              "idéal près de chez toi",
              "Réserve en quelques clics,",
              "sans stress"
            ]}
            buttonText="Trouver mon style"
            imageSource={require('@/assets/images/espace_client.jpg')}
            onPress={() => handleRoleSelect('client')}
            delay={400}
          />

          <RoleCard
            role="coiffeur"
            title="Je suis"
            subtitle="coiffeur / coiffeuse"
            description={[
              "Gère tes rendez-vous,",
              "attire plus de clients",
              "Et développe ton activité",
              "avec AfroPlan Pro"
            ]}
            buttonText="Passer en mode Pro"
            imageSource={require('@/assets/images/espace_coiffeur.jpg')}
            onPress={() => handleRoleSelect('coiffeur')}
            delay={500}
          />
        </View>

        {/* Trust Section */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.trustSection}
        >
          <Text style={styles.trustText}>
            Déjà +100 coiffeurs nous font confiance.
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <Ionicons key={index} name="star" size={18} color="#191919" />
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 20 : 30,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 35 : 40,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },
  brandName: {
    fontSize: isSmallScreen ? 24 : 28,
    color: '#191919',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#808080',
    marginTop: 4,
  },
  questionSection: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 24 : 32,
    paddingHorizontal: 24,
    marginBottom: isSmallScreen ? 20 : 24,
  },
  questionTitle: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '700',
    color: '#191919',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#808080',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: cardWidth,
  },
  card: {
    height: isSmallScreen ? 280 : 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  cardTextSection: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
  },
  cardSubtitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: isSmallScreen ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: isSmallScreen ? 16 : 18,
  },
  cardButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  cardButtonText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#191919',
  },
  trustSection: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 28 : 36,
    paddingHorizontal: 24,
  },
  trustText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#4A4A4A',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
});
