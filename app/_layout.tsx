import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? AfroPlanDarkTheme : AfroPlanLightTheme;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
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
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}