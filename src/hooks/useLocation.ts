import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAndFetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      setPermissionDenied(false);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let city: string | undefined;
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        city = geocode[0]?.city ?? geocode[0]?.subregion ?? undefined;
      } catch (e) {
        console.warn('[useLocation] Reverse geocoding failed:', e);
      }

      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city,
      });
    } catch (e: any) {
      console.error('[useLocation] Error:', e);
      setError(e.message ?? 'Erreur de géolocalisation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAndFetchLocation();
  }, [requestAndFetchLocation]);

  return {
    location,
    loading,
    permissionDenied,
    error,
    retry: requestAndFetchLocation,
  };
}
