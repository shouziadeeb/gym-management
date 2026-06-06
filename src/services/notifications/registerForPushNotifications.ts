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
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
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
    logger.info('notifications.token_registered', {
      platform: Platform.OS,
      hasProjectId: Boolean(projectId),
    });
    return { granted: true, token: tokenResponse.data };
  } catch (error) {
    logger.warn('notifications.token_registration_failed', {
      platform: Platform.OS,
      error: error instanceof Error ? error.message : String(error),
    });
    return { granted: false, reason: 'error' };
  }
}
