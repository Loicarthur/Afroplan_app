/**
 * Point d'entrée de l'application - Redirige vers l'écran d'onboarding (photos)
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // Redirige d'emblée vers l'écran d'onboarding pour que les photos s'affichent au lancement
  return <Redirect href="/onboarding" />;
}
