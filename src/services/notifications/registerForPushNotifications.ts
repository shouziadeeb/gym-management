import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { EXPO_PUSH_CHANNEL } from '@/constants/notifications';
import { logger } from '@/lib/logger';

export type PushRegistrationResult =
  | { granted: true; token: string }
  | { granted: false; reason: 'simulator' | 'denied' | 'error' | 'unsupported' };

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function shouldLogPushTokenInConsole(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_ALLOW_PROD_DEV_AUTH === 'true';
}

/** Prints the Expo push token in Metro/device logs for manual push testing. */
export function logExpoPushToken(token: string, userId?: string): void {
  if (!shouldLogPushTokenInConsole()) return;

  console.log('\n========================================');
  console.log('EXPO PUSH TOKEN — copy for test notifications');
  if (userId) console.log('User ID:', userId);
  console.log('Token:', token);
  console.log('Send a test push: https://expo.dev/notifications');
  console.log('========================================\n');
}

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
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      showBadge: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('notifications.permission_denied', { platform: Platform.OS });
    return { granted: false, reason: 'denied' };
  }

  try {
    const projectId = resolveExpoProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    logger.info('notifications.token_registered', {
      platform: Platform.OS,
      hasProjectId: Boolean(projectId),
      token,
    });
    return { granted: true, token };
  } catch (error) {
    logger.warn('notifications.token_registration_failed', {
      platform: Platform.OS,
      error: error instanceof Error ? error.message : String(error),
    });
    return { granted: false, reason: 'error' };
  }
}
