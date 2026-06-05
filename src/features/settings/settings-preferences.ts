import AsyncStorage from '@react-native-async-storage/async-storage';

import { resolveDeviceLanguage } from '@/i18n/device-language';
import { isLanguageCode, type LanguageCode } from '@/i18n/types';

export type { LanguageCode };

const STORAGE_KEY = 'gym_settings_preferences_v1';
export type DateFormatPreference = 'dmy' | 'mdy';
export type TimeFormatPreference = '12h' | '24h';

export type NotificationPreferences = {
  pushEnabled: boolean;
  membershipExpiry: boolean;
  paymentAlerts: boolean;
  newMemberAlerts: boolean;
};

export type BookingPreferences = {
  slotDurationMinutes: number;
  cancellationHours: number;
};

export type SettingsPreferences = {
  notifications: NotificationPreferences;
  language: LanguageCode;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
  bookings: BookingPreferences;
};

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  notifications: {
    pushEnabled: true,
    membershipExpiry: true,
    paymentAlerts: true,
    newMemberAlerts: true,
  },
  language: 'en',
  dateFormat: 'dmy',
  timeFormat: '12h',
  bookings: {
    slotDurationMinutes: 60,
    cancellationHours: 24,
  },
};

export const DATE_FORMAT_OPTIONS: { value: DateFormatPreference; label: string }[] = [
  { value: 'dmy', label: 'DD / MM / YYYY' },
  { value: 'mdy', label: 'MM / DD / YYYY' },
];

export const TIME_FORMAT_OPTIONS: { value: TimeFormatPreference; label: string }[] = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

export const SLOT_DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;

export const CANCELLATION_POLICY_OPTIONS = [
  { hours: 12, label: '12 hours before' },
  { hours: 24, label: '24 hours before' },
  { hours: 48, label: '48 hours before' },
] as const;

export async function loadSettingsPreferences(): Promise<SettingsPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS_PREFERENCES,
        language: resolveDeviceLanguage(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<SettingsPreferences>;
    const language = isLanguageCode(parsed.language)
      ? parsed.language
      : DEFAULT_SETTINGS_PREFERENCES.language;

    return {
      ...DEFAULT_SETTINGS_PREFERENCES,
      ...parsed,
      language,
      notifications: {
        ...DEFAULT_SETTINGS_PREFERENCES.notifications,
        ...parsed.notifications,
      },
      bookings: {
        ...DEFAULT_SETTINGS_PREFERENCES.bookings,
        ...parsed.bookings,
      },
    };
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES;
  }
}

export async function saveSettingsPreferences(prefs: SettingsPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
