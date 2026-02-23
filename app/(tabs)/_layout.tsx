import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await bookingService.getClientBookings(user.id);
          // On compte les RDV à venir (pending ou confirmed)
          const count = response.data.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
          setActiveBookingsCount(count);
        } catch (e) {
          setActiveBookingsCount(0);
        }
      }
    };
    fetchCount();
    // Rafraîchir toutes les 30 secondes pour la démo
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 85,
          paddingTop: 8,
          paddingBottom: 25,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Recherche',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Rendez-vous',
          headerShown: false,
          tabBarBadge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* L'onglet "Styles" est masqué de la barre de navigation :
          la navigation par style se fait via les cartes de la page Accueil.
          La route /bookings reste accessible en interne si besoin. */}
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
