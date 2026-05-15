import { supabase } from '@/lib/supabase';

export async function upsertPushToken(userId: string, token: string, platform?: string) {
  const { error } = await supabase.from('push_tokens').upsert(
    { user_id: userId, expo_push_token: token, platform: platform ?? null },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) throw error;
}