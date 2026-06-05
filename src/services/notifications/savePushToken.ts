import { upsertPushTokenWithRole } from '@/api/push.api';

export async function savePushToken(
  userId: string,
  token: string,
  platform?: string,
): Promise<void> {
  await upsertPushTokenWithRole(userId, token, platform);
}
