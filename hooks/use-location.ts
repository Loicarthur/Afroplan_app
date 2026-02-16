/**
 * Hook useLocation - Géolocalisation utilisateur AfroPlan
 * Gère permissions, position actuelle et calcul de distance
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

// Distance presets in km
export const DISTANCE_PRESETS = [5, 10, 20, 50, 60] as const;
export type DistancePreset = typeof DISTANCE_PRESETS[number];

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setError('Permission de localisation refusée');
      }
      return granted;
    } catch (err) {
      setError('Erreur lors de la demande de permission');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const granted = await requestPermission();
      if (!granted) {
        setIsLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation: UserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(userLocation);
      setIsLoading(false);
      return userLocation;
    } catch (err) {
      setError('Impossible de récupérer votre position');
      setIsLoading(false);
      return null;
    }
  }, [requestPermission]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Get distance from user's current location to a point
  const getDistanceFromUser = useCallback(
    (lat: number, lon: number): number | null => {
      if (!location) return null;
      return calculateDistance(location.latitude, location.longitude, lat, lon);
    },
    [location, calculateDistance]
  );

  // Format distance for display
  const formatDistance = useCallback((distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }, []);

  return {
    location,
    isLoading,
    error,
    permissionGranted,
    requestPermission,
    getCurrentLocation,
    calculateDistance,
    getDistanceFromUser,
    formatDistance,
    DISTANCE_PRESETS,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
