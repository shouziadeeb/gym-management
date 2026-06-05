import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isNativePushSupported = Platform.OS === 'ios' || Platform.OS === 'android';

const noopSubscription = { remove: () => {} };

if (isNativePushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  if (!isNativePushSupported) {
    return noopSubscription;
  }

  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  if (!isNativePushSupported) {
    return noopSubscription;
  }

  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function getLastNotificationResponse() {
  if (!isNativePushSupported) {
    return null;
  }

  return Notifications.getLastNotificationResponseAsync();
}

export async function setBadgeCount(count: number) {
  if (!isNativePushSupported) {
    return;
  }

  await Notifications.setBadgeCountAsync(count);
}
