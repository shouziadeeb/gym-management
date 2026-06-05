import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_SETTINGS_PREFERENCES,
  loadSettingsPreferences,
  saveSettingsPreferences,
  type SettingsPreferences,
} from '@/features/settings/settings-preferences';

export function useSettingsPreferences() {
  const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_SETTINGS_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadSettingsPreferences();
      setPreferences(loaded);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load preferences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updatePreferences = useCallback(
    async (patch: Partial<SettingsPreferences> | ((prev: SettingsPreferences) => SettingsPreferences)) => {
      setPreferences((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
        void saveSettingsPreferences(next);
        return next;
      });
    },
    [],
  );

  const updateNotifications = useCallback(
    (patch: Partial<SettingsPreferences['notifications']>) => {
      void updatePreferences((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, ...patch },
      }));
    },
    [updatePreferences],
  );

  const updateBookings = useCallback(
    (patch: Partial<SettingsPreferences['bookings']>) => {
      void updatePreferences((prev) => ({
        ...prev,
        bookings: { ...prev.bookings, ...patch },
      }));
    },
    [updatePreferences],
  );

  return {
    preferences,
    loading,
    error,
    reload,
    updatePreferences,
    updateNotifications,
    updateBookings,
  };
}
