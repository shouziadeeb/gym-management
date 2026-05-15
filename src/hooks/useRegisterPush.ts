import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { EXPO_PUSH_CHANNEL } from '@/constants/notifications';
import { upsertPushToken } from '@/api/push.api';
import { useAuthStore } from '@/store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useRegisterPush() {
  const userId = useAuthStore((state) => state.session?.user.id);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(EXPO_PUSH_CHANNEL, {
          name: EXPO_PUSH_CHANNEL,
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      await upsertPushToken(userId, tokenResponse.data, Platform.OS);
    })().catch(() => {
      // no-op in dev
    });
  }, [userId]);
}