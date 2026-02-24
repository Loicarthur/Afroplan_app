/**
 * Layout pour l'espace coiffeur AfroPlan
 * Navigation optimisée : 5 onglets max, badge réservations, responsive
 */

import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/booking.service';
import { salonService } from '@/services/salon.service';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function CoiffeurLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // Charger le nombre de réservations en attente pour le badge
  const loadPendingCount = async () => {
    if (!user || !isAuthenticated) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const response = await bookingService.getSalonBookings(salon.id);
        const pending = response.data.filter(
          (b) => b.status === 'pending'
        ).length;
        setPendingCount(pending);
      }
    } catch {
      // Silencieux : pas bloquant
    }
  };

  useEffect(() => {
    loadPendingCount();
  }, [isAuthenticated, user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 10 : 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      {/* ① Accueil / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ② Réservations — avec badge en attente */}
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Agenda',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ③ Mon Salon + Services (regroupés) */}
      <Tabs.Screen
        name="salon"
        options={{
          title: 'Mon Salon',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ④ Portfolio */}
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ⑤ Profil */}
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Onglets cachés de la tab bar — accessibles par navigation directe */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Mes Services',
          href: null, // Caché de la tab bar, accessible via Dashboard ou Profil
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cut-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}
