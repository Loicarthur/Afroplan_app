import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookingReminders } from '@/hooks/use-booking-reminders';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';
import { notificationService } from '@/services/notification.service';

SplashScreen.preventAutoHideAsync();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const SELECTED_ROLE_KEY = '@afroplan_selected_role';

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
  const { isAuthenticated, isLoading, profile } = useAuth();
  const segments = useSegments();
  
  // Activer les rappels de RDV
  useBookingReminders();

  // Navigation Globale (Auth Guard & Redirection)
  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'role-selection';
    const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!isAuthenticated) {
      // Si on n'est pas connecté et qu'on est au démarrage (isRoot)
      // on force le passage par l'onboarding, même si un rôle était déjà choisi
      if (isRoot) {
        router.replace('/onboarding');
      }
    } else if (profile) {
      // Si on est connecté et que le profil est chargé
      // On ne redirige AUTOMATIQUEMENT que si on est sur une page "transitoire" (Login, Onboarding, Splash)
      if (inAuthGroup || inOnboarding || isRoot) {
        AsyncStorage.getItem(SELECTED_ROLE_KEY).then(selectedRole => {
          const roleToUse = selectedRole || profile.role;
          if (roleToUse === 'coiffeur') {
            router.replace('/(coiffeur)');
          } else {
            router.replace('/(tabs)');
          }
        });
      }
    }
  }, [isAuthenticated, isLoading, profile, segments]);

  React.useEffect(() => {
    let responseListener: any;

    const setupNotifications = async () => {
      try {
        // Demander les permissions au démarrage via le service sécurisé
        await notificationService.registerForPushNotificationsAsync();

        // Importer dynamiquement pour éviter le crash au chargement si le module natif manque
        const Notifications = await import('expo-notifications');
        
        // Gérer le clic sur la notification
        responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          if (data?.booking_id) {
            console.log('Notification cliquée pour le booking:', data.booking_id);
          }
        });
      } catch (e) {
        console.warn('Notifications non disponibles (Build natif requis)');
      }
    };

    setupNotifications();

    // Cacher le splash screen une fois l'app chargée
    SplashScreen.hideAsync();

    return () => {
      if (responseListener) {
        import('expo-notifications').then(Notifications => {
          Notifications.removeNotificationSubscription(responseListener);
        }).catch(() => {});
      }
    };
  }, []);

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="role-selection" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(coiffeur)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(salon)" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Paiement sécurisé', presentation: 'modal' }} />
        <Stack.Screen
          name="salon/[id]"
          options={{
            headerShown: false, // On utilise notre propre bouton retour
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            headerShown: false, // On utilise notre propre bouton retour
          }}
        />
        <Stack.Screen
          name="category-styles/[categoryId]"
          options={{
            headerShown: false, // On utilise notre propre bouton retour
          }}
        />
        <Stack.Screen
          name="style-salons/[styleId]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="chat"
          options={{ 
            headerShown: false, // On laisse le layout interne gérer son propre header
          }}
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