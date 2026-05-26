import { useCallback, useEffect, useMemo, useState } from 'react';

import * as Location from 'expo-location';

import type { GeoCoordinates } from '@/domain/discovery/types';

type Status = 'idle' | 'checking' | 'ready' | 'unavailable';

export function useUserCoordinates(options?: { subscribe?: boolean }) {
  const subscribe = options?.subscribe ?? true;
  const [status, setStatus] = useState<Status>('idle');
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);

  const readGrantedPosition = useCallback(async () => {
    setStatus((prev) => (prev === 'idle' ? 'checking' : prev));

    try {
      const existing = await Location.getForegroundPermissionsAsync();

      if (existing.status !== Location.PermissionStatus.GRANTED) {
        setCoords(null);
        setStatus('unavailable');
        return null;
      }

      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: GeoCoordinates = {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      };

      setCoords(next);
      setStatus('ready');
      return next;
    } catch {
      setCoords(null);
      setStatus('unavailable');
      return null;
    }
  }, []);

  const requestCoordinates = useCallback(async () => {
    setStatus('checking');

    try {
      const asked = await Location.requestForegroundPermissionsAsync();

      if (asked.status !== Location.PermissionStatus.GRANTED) {
        setCoords(null);
        setStatus('unavailable');
        return null;
      }

      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const next: GeoCoordinates = {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      };

      setCoords(next);
      setStatus('ready');
      return next;
    } catch {
      setCoords(null);
      setStatus('unavailable');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!subscribe) return;

    let cancelled = false;

    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setStatus('idle');
        return;
      }

      await readGrantedPosition();
    })();

    return () => {
      cancelled = true;
    };
  }, [readGrantedPosition, subscribe]);

  const coordsKey = useMemo(() => {
    if (!coords) return null;
    return `${coords.latitude.toFixed(2)}_${coords.longitude.toFixed(2)}`;
  }, [coords]);

  return {
    coords,
    coordsKey,
    status,
    refresh: requestCoordinates,
    hydrateIfGranted: readGrantedPosition,
  };
}
