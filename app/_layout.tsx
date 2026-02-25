import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookingReminders } from '@/hooks/use-booking-reminders';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';
import { notificationService } from '@/services/notification.service';

SplashScreen.preventAutoHideAsync();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

const AfroPlanLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
};

const AfroPlanDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
};

function RootContent() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? AfroPlanDarkTheme : AfroPlanLightTheme;
  
  // Activer les rappels de RDV
  useBookingReminders();

  React.useEffect(() => {
    let subscription: any;

    const setupNotifications = async () => {
      // Les notifications Push sont temporairement désactivées pour résoudre un conflit système.
      // Les notifications In-App (la cloche) restent 100% fonctionnelles.
    };

    setupNotifications();

    // Cacher le splash screen une fois l'app chargée
    SplashScreen.hideAsync();

    return () => {
      if (subscription && subscription.remove) subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="role-selection" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(coiffeur)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(salon)" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen
          name="salon/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            headerBackTitle: 'Retour',
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Reservation',
            headerBackTitle: 'Retour',
          }}
        />
        <Stack.Screen
          name="style-salons/[styleId]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="terms"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.afroplan" // Requis pour Apple Pay
      >
        <SafeAreaProvider>
          <AuthProvider>
            <LanguageProvider>
              <RootContent />
            </LanguageProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}