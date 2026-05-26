import * as Location from 'expo-location';

import { Platform } from 'react-native';

export type PickedCoordinates = {
  latitude: number;
  longitude: number;
  /** Human-readable preview (reverse-geocode when available). */
  label?: string;
};

function normalizeCoords(latitude: number, longitude: number): PickedCoordinates {
  return {
    latitude,
    longitude,
  };
}

export async function reverseGeocodeLabel(coords: Pick<PickedCoordinates, 'latitude' | 'longitude'>): Promise<string | undefined> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const place = results[0];
    if (!place) return undefined;

    const parts = [place.name, place.city, place.region, place.country, place.postalCode].filter(Boolean) as string[];

    const label = Array.from(new Set(parts.map((p) => String(p).trim()).filter(Boolean))).join(', ');
    return label.length > 0 ? label : undefined;
  } catch {
    return undefined;
  }
}

async function currentPositionFromWeb(): Promise<PickedCoordinates> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('This browser cannot access geolocation.');
  }

  const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 60_000,
      timeout: 20_000,
    });
  });

  const latitude = coords.coords.latitude;
  const longitude = coords.coords.longitude;
  const fallback = normalizeCoords(latitude, longitude);

  try {
    const label = await reverseGeocodeLabel(fallback);
    return { ...fallback, label };
  } catch {
    return fallback;
  }
}

/** Request foreground permission when needed (native), resolve current coords + readable label when possible. */
export async function pickDeviceCoordinates(): Promise<PickedCoordinates> {
  if (Platform.OS === 'web') {
    return currentPositionFromWeb();
  }

  const existing = await Location.getForegroundPermissionsAsync();
  let status = existing.status;

  if (status !== Location.PermissionStatus.GRANTED) {
    const asked = await Location.requestForegroundPermissionsAsync();
    status = asked.status;
  }

  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission is needed to capture your GPS position.');
  }

  const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const base = normalizeCoords(fix.coords.latitude, fix.coords.longitude);
  const label = await reverseGeocodeLabel(base);
  return { ...base, label };
}

/** Forward-geocode free-form address → coordinates (accuracy depends on platform / region). */
export async function coordinatesFromAddressQuery(addressQuery: string): Promise<PickedCoordinates | null> {
  const query = addressQuery.trim();
  if (query.length < 6) return null;

  try {
    const results = await Location.geocodeAsync(query);
    const hit = results[0];
    if (!hit) return null;

    const coords = normalizeCoords(hit.latitude, hit.longitude);
    const label = (await reverseGeocodeLabel(coords)) ?? query;

    return { ...coords, label };
  } catch {
    return null;
  }
}
