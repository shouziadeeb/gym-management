import { supabase } from '@/lib/supabase';

/** @deprecated Prefer upsertPushTokenWithRole — keeps profile role on the token row. */
export async function upsertPushToken(userId: string, token: string, platform?: string) {
  return upsertPushTokenWithRole(userId, token, platform);
}

export async function upsertPushTokenWithRole(
  userId: string,
  token: string,
  platform?: string,
) {
  const { error } = await supabase.rpc('upsert_push_token_with_role', {
    p_user_id: userId,
    p_expo_push_token: token,
    p_platform: platform ?? null,
  });

  if (error) throw error;
}
