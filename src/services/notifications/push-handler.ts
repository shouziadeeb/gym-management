import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
