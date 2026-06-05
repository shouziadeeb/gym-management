import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { EXPO_PUSH_CHANNEL } from '@/constants/notifications';

export type PushRegistrationResult =
  | { granted: true; token: string }
  | { granted: false; reason: 'simulator' | 'denied' | 'error' | 'unsupported' };

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') {
    return { granted: false, reason: 'unsupported' };
  }

  if (!Device.isDevice) {
    return { granted: false, reason: 'simulator' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(EXPO_PUSH_CHANNEL, {
      name: 'GYM Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { granted: false, reason: 'denied' };
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return { granted: true, token: tokenResponse.data };
  } catch {
    return { granted: false, reason: 'error' };
  }
}
