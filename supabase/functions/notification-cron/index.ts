import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendExpoPushBatch } from '../_shared/expo-push.ts';

type MembershipRow = {
  id: string;
  gym_id: string;
  member_id: string;
  expiry_date: string;
  status: string;
  gyms: { name: string; owner_id: string } | null;
};

const EXPIRY_RULES = [
  { days: 5, type: 'membership_expiry_5d', title: 'Membership expiring soon' },
  { days: 3, type: 'membership_expiry_3d', title: 'Membership expiring in 3 days' },
  { days: 1, type: 'membership_expiry_1d', title: 'Membership expiring tomorrow' },
  { days: 0, type: 'membership_expired', title: 'Membership expired' },
] as const;

async function createNotification(
  supabase: ReturnType<typeof createClient>,
  input: {
    userId: string;
    gymId: string | null;
    title: string;
    body: string;
    type: string;
    role: string;
    dedupKey: string;
  },
) {
  const { data, error } = await supabase.rpc('create_notification_record', {
    p_user_id: input.userId,
    p_title: input.title,
    p_body: input.body,
    p_type: input.type,
    p_audience_role: input.role,
    p_gym_id: input.gymId,
    p_channel: 'in_app',
    p_data: {},
    p_dedup_key: input.dedupKey,
  });

  if (error) {
    console.error('create_notification_record failed', error.message);
    return null;
  }

  return data as string;
}

async function pushToUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId);

  if (!tokens?.length) return 0;

  await sendExpoPushBatch(
    tokens.map((row) => ({
      to: row.expo_push_token,
      title,
      body,
      data,
      sound: 'default',
    })),
  );

  return tokens.length;
}

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

  const today = new Date().toISOString().slice(0, 10);
  let created = 0;
  let pushed = 0;

  await supabase.rpc('refresh_membership_statuses');

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, gym_id, member_id, expiry_date, status, gyms(name, owner_id)')
    .in('status', ['active', 'expiring_soon', 'expired']);

  for (const membership of (memberships ?? []) as MembershipRow[]) {
    const gymName = membership.gyms?.name ?? 'your gym';
    const daysUntil = Math.floor(
      (Date.parse(membership.expiry_date) - Date.parse(today)) / 86_400_000,
    );

    for (const rule of EXPIRY_RULES) {
      if (daysUntil !== rule.days) continue;

      const body =
        rule.days === 0
          ? `Your membership at ${gymName} has expired. Renew to keep access.`
          : `Your membership at ${gymName} expires in ${rule.days} day${rule.days === 1 ? '' : 's'}.`;

      const id = await createNotification(supabase, {
        userId: membership.member_id,
        gymId: membership.gym_id,
        title: rule.title,
        body,
        type: rule.type,
        role: 'member',
        dedupKey: `${rule.type}:${membership.id}:${today}`,
      });

      if (id) {
        created += 1;
        pushed += await pushToUser(supabase, membership.member_id, rule.title, body, {
          notificationId: id,
          type: rule.type,
        });
      }

      if (rule.days === 0 && membership.gyms?.owner_id) {
        const ownerTitle = 'Member membership expired';
        const ownerBody = `A member's plan at ${gymName} has expired.`;
        const ownerId = await createNotification(supabase, {
          userId: membership.gyms.owner_id,
          gymId: membership.gym_id,
          title: ownerTitle,
          body: ownerBody,
          type: 'owner_membership_expired',
          role: 'owner',
          dedupKey: `owner_membership_expired:${membership.id}:${today}`,
        });
        if (ownerId) {
          created += 1;
          pushed += await pushToUser(supabase, membership.gyms.owner_id, ownerTitle, ownerBody, {
            notificationId: ownerId,
            type: 'owner_membership_expired',
          });
        }
      }
    }

    if (membership.status === 'expiring_soon' && daysUntil === 3) {
      const pendingTitle = 'Payment reminder';
      const pendingBody = `Your payment for ${gymName} may be due soon.`;
      const payId = await createNotification(supabase, {
        userId: membership.member_id,
        gymId: membership.gym_id,
        title: pendingTitle,
        body: pendingBody,
        type: 'payment_pending',
        role: 'member',
        dedupKey: `payment_pending:${membership.id}:${today}`,
      });
      if (payId) {
        created += 1;
        pushed += await pushToUser(supabase, membership.member_id, pendingTitle, pendingBody, {
          notificationId: payId,
          type: 'payment_pending',
        });
      }
    }
  }

  const { data: gyms } = await supabase.from('gyms').select('id, name, owner_id');

  for (const gym of gyms ?? []) {
    const dayStart = `${today}T00:00:00.000Z`;
    const dayEnd = `${today}T23:59:59.999Z`;

    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gym.id)
      .gte('checked_in_at', dayStart)
      .lte('checked_in_at', dayEnd);

    const summaryTitle = 'Daily attendance summary';
    const summaryBody = `${attendanceCount ?? 0} check-ins at ${gym.name} today.`;
    const summaryId = await createNotification(supabase, {
      userId: gym.owner_id,
      gymId: gym.id,
      title: summaryTitle,
      body: summaryBody,
      type: 'owner_attendance_summary',
      role: 'owner',
      dedupKey: `owner_attendance_summary:${gym.id}:${today}`,
    });

    if (summaryId) {
      created += 1;
      pushed += await pushToUser(supabase, gym.owner_id, summaryTitle, summaryBody, {
        notificationId: summaryId,
        type: 'owner_attendance_summary',
      });
    }

    if ((attendanceCount ?? 0) < 3) {
      const lowTitle = 'Low attendance warning';
      const lowBody = `Only ${attendanceCount ?? 0} check-ins at ${gym.name} today.`;
      const lowId = await createNotification(supabase, {
        userId: gym.owner_id,
        gymId: gym.id,
        title: lowTitle,
        body: lowBody,
        type: 'owner_low_attendance',
        role: 'owner',
        dedupKey: `owner_low_attendance:${gym.id}:${today}`,
      });
      if (lowId) {
        created += 1;
        pushed += await pushToUser(supabase, gym.owner_id, lowTitle, lowBody, {
          notificationId: lowId,
          type: 'owner_low_attendance',
        });
      }
    }
  }

  const weekday = new Date().getUTCDay();
  if (weekday === 1) {
    for (const gym of gyms ?? []) {
      const weekKey = today.slice(0, 10);
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('gym_id', gym.id)
        .gte('paid_at', new Date(Date.now() - 7 * 86_400_000).toISOString());

      const totalCents = (payments ?? []).reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
      const revenueTitle = 'Weekly revenue summary';
      const revenueBody = `${gym.name} collected ${(totalCents / 100).toFixed(2)} this week.`;
      const revenueId = await createNotification(supabase, {
        userId: gym.owner_id,
        gymId: gym.id,
        title: revenueTitle,
        body: revenueBody,
        type: 'owner_weekly_report',
        role: 'owner',
        dedupKey: `owner_weekly_report:${gym.id}:${weekKey}`,
      });
      if (revenueId) {
        created += 1;
        pushed += await pushToUser(supabase, gym.owner_id, revenueTitle, revenueBody, {
          notificationId: revenueId,
          type: 'owner_weekly_report',
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, created, pushed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
