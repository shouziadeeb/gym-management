import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendExpoPushBatch } from '../_shared/expo-push.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  if (!authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: pending, error: pendingError } = await admin
    .from('notifications')
    .select('id, user_id, title, body, data')
    .eq('user_id', user.id)
    .is('sent_at', null)
    .in('channel', ['push', 'in_app'])
    .order('created_at', { ascending: true })
    .limit(20);

  if (pendingError) {
    console.error('flush-user-push.pending_query_failed', pendingError.message);
    return new Response(JSON.stringify({ ok: false, error: pendingError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!pending?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, flushed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tokens } = await admin
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', user.id);

  if (!tokens?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0, flushed: 0, reason: 'no_push_tokens' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let flushed = 0;

  for (const notification of pending) {
    await sendExpoPushBatch(
      tokens.map((row) => ({
        to: row.expo_push_token,
        title: notification.title,
        body: notification.body ?? '',
        data: { notificationId: notification.id, ...(notification.data as object) },
        sound: 'default',
      })),
    );

    const { error: updateError } = await admin
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('user_id', user.id);

    if (!updateError) {
      flushed += 1;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent: tokens.length * flushed, flushed }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
