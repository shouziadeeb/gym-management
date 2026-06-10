import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { buildExpoPushMessage, sendExpoPushBatch } from '../_shared/expo-push.ts';

type PushRequest = {
  userId?: string;
  notificationId?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: PushRequest = {};
  try {
    if (req.method === 'POST') {
      payload = (await req.json()) as PushRequest;
    }
  } catch {
    payload = {};
  }

  if (payload.notificationId) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, body, data, sent_at')
      .eq('id', payload.notificationId)
      .maybeSingle();

    if (error || !notification || notification.sent_at) {
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', notification.user_id);

    await sendExpoPushBatch(
      (tokens ?? []).map((row) =>
        buildExpoPushMessage({
          to: row.expo_push_token,
          title: notification.title,
          body: notification.body ?? '',
          data: { notificationId: notification.id, ...(notification.data as object) },
        }),
      ),
    );

    await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString(), channel: 'push' })
      .eq('id', notification.id);

    return new Response(JSON.stringify({ ok: true, sent: tokens?.length ?? 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (payload.userId && payload.title) {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', payload.userId);

    await sendExpoPushBatch(
      (tokens ?? []).map((row) =>
        buildExpoPushMessage({
          to: row.expo_push_token,
          title: payload.title!,
          body: payload.body ?? '',
          data: payload.data ?? {},
        }),
      ),
    );

    return new Response(JSON.stringify({ ok: true, sent: tokens?.length ?? 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: pending } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, data')
    .is('sent_at', null)
    .in('channel', ['push', 'in_app'])
    .order('created_at', { ascending: true })
    .limit(50);

  let sent = 0;
  for (const notification of pending ?? []) {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', notification.user_id);

    if (!tokens?.length) continue;

    await sendExpoPushBatch(
      tokens.map((row) =>
        buildExpoPushMessage({
          to: row.expo_push_token,
          title: notification.title,
          body: notification.body ?? '',
          data: { notificationId: notification.id, ...(notification.data as object) },
        }),
      ),
    );

    await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification.id);

    sent += tokens.length;
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
