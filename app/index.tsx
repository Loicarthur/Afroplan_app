/**
 * Point d'entrée de l'application - Redirige vers le Splash Screen
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/splash" />;
}
