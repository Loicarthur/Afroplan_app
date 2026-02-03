/**
 * Point d'entrée de l'application - Redirige vers l'écran de sélection de rôle
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/role-selection" />;
}
