import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Locker } from '@/api';

export interface Coords { latitude: number; longitude: number }

// Great-circle distance in km
export function distanceKm(a: Coords, b: Coords) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const lockerCoords = (l: Locker): Coords => ({ latitude: l.location.lat, longitude: l.location.lng });

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
export const walkMinutes = (km: number) => Math.max(1, Math.round((km / 5) * 60)); // ~5 km/h

export function sortByDistance(lockers: Locker[], from: Coords | null) {
  const withDistance = lockers.map((l) => ({ locker: l, km: from ? distanceKm(from, lockerCoords(l)) : null }));
  if (from) withDistance.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  return withDistance;
}

type Status = 'checking' | 'undetermined' | 'granted' | 'denied' | 'unavailable';

/**
 * Device location for SmartBox distances.
 * With `prompt: false` it only uses a permission the user already granted (never shows the OS dialog).
 */
export function useUserLocation({ prompt }: { prompt: boolean }) {
  const [status, setStatus] = useState<Status>('checking');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const locate = useCallback(async () => {
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) setCoords(last.coords);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords(pos.coords);
    } catch {
      setStatus((s) => (s === 'granted' ? 'unavailable' : s)); // GPS off or timed out
    }
  }, []);

  const request = useCallback(async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    setCanAskAgain(res.canAskAgain);
    setStatus(res.granted ? 'granted' : 'denied');
    if (res.granted) await locate();
  }, [locate]);

  useEffect(() => {
    (async () => {
      const current = await Location.getForegroundPermissionsAsync();
      setCanAskAgain(current.canAskAgain);
      if (current.granted) {
        setStatus('granted');
        await locate();
      } else if (current.status === Location.PermissionStatus.UNDETERMINED && prompt) {
        await request();
      } else {
        setStatus(current.status === Location.PermissionStatus.UNDETERMINED ? 'undetermined' : 'denied');
      }
    })();
  }, [prompt, locate, request]);

  // When the OS will not show the dialog again, the only path is the app's settings page
  const enable = useCallback(() => (canAskAgain ? request() : Linking.openSettings()), [canAskAgain, request]);

  return { status, coords, enable };
}

export function openDirections(locker: Locker) {
  const { lat, lng } = locker.location;
  const label = encodeURIComponent(locker.name);
  const url = Platform.OS === 'ios'
    ? `maps:?daddr=${lat},${lng}&q=${label}`
    : `geo:0,0?q=${lat},${lng}(${label})`;
  return Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`),
  );
}
