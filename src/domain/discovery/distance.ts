import type { GeoCoordinates } from './types';

const EARTH_RADIUS_METERS = 6_371_000;

/** Haversine distance in meters (WGS84 sphere approximation). Swap for turf/postgis RPC at scale. */
export function metersBetween(origin: GeoCoordinates, targetLat: number, targetLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(targetLat - origin.latitude);
  const dLon = toRad(targetLng - origin.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.latitude)) *
      Math.cos(toRad(targetLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_METERS * c;
}

export function formatDistanceLabel(meters: number | null | undefined): string | null {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters <= 0) return null;

  if (meters < 1000) {
    return `${Math.max(50, Math.round(meters / 50) * 50)} m away`;
  }

  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)} km away`;
  }

  return `${Math.round(km)} km away`;
}
