/**
 * Layout pour l'espace coiffeur AfroPlan
 * Navigation optimisée : 5 onglets métier, badge réservations, responsive
 *
 * Tab bar (ordre métier) :
 *  ① Accueil   — Dashboard + agenda du jour
 *  ② Agenda    — Toutes les réservations (badge en attente)
 *  ③ Services  — Ce que tu proposes aux clients (tarifs, durées)
 *  ④ Portfolio — Tes réalisations
 *  ⑤ Profil   — Infos perso + accès Mon Salon (config une fois)
 *
 *  Mon Salon → accessible depuis Profil > "Mon Salon"
 *  Messages  → accessible depuis Dashboard > Raccourcis
 */

import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

  // Badge : nombre de réservations en attente de confirmation
  const loadPendingCount = async () => {
    if (!user || !isAuthenticated) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const response = await bookingService.getSalonBookings(salon.id);
        const pending = response.data.filter((b) => b.status === 'pending').length;
        setPendingCount(pending);
      }
    } catch {
      // Non bloquant
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
        headerStyle: { backgroundColor: colors.card },
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

      {/* ② Agenda / Réservations — badge rouge si réservations en attente */}
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

      {/* ③ Services — tes prestations et tarifs proposés aux clients */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cut-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ④ Portfolio — tes réalisations */}
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ⑤ Profil — infos + accès Mon Salon */}
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

      {/* Pages hors tab bar — accessibles par navigation directe */}
      <Tabs.Screen
        name="salon"
        options={{
          title: 'Mon Salon',
          href: null, // Accessible depuis Profil > "Mon Salon"
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
