/**
 * Layout pour les pages Salon/Coiffeur
 */

import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SalonLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="reservations" />
      <Stack.Screen name="services" />
      <Stack.Screen name="reviews" />
    </Stack>
  );
}
