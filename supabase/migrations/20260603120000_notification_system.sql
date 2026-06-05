-- Notification system: typed in-app + push delivery, token roles, RPCs, attendance trigger.

do $$ begin
  create type public.app_notification_type as enum (
    'membership_expiry_5d',
    'membership_expiry_3d',
    'membership_expiry_1d',
    'membership_expired',
    'payment_pending',
    'payment_success',
    'checkin_success',
    'attendance_missed',
    'class_upcoming',
    'trainer_assigned',
    'schedule_changed',
    'class_cancelled',
    'announcement_offer',
    'announcement_holiday',
    'announcement_gym_update',
    'owner_new_member',
    'owner_membership_renewed',
    'owner_membership_expired',
    'owner_payment_received',
    'owner_payment_pending',
    'owner_payment_failed',
    'owner_join_request',
    'owner_new_inquiry',
    'owner_attendance_summary',
    'owner_low_attendance',
    'owner_trainer_added',
    'owner_trainer_request',
    'owner_revenue_summary',
    'owner_weekly_report',
    'owner_plan_expiry'
  );
exception when duplicate_object then null;
end $$;

alter table public.notifications
  add column if not exists type public.app_notification_type,
  add column if not exists audience_role public.user_role;

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists idx_notifications_type
  on public.notifications (user_id, type, created_at desc);

alter table public.push_tokens
  add column if not exists role public.user_role,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_push_tokens_updated on public.push_tokens;
create trigger trg_push_tokens_updated before update on public.push_tokens
for each row execute function public.set_updated_at();

create or replace function public.create_notification_record(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type public.app_notification_type,
  p_audience_role public.user_role default 'member',
  p_gym_id uuid default null,
  p_channel public.notification_channel default 'in_app',
  p_data jsonb default '{}'::jsonb,
  p_dedup_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_dedup_key is not null then
    select n.id into v_id
    from public.notifications n
    where n.user_id = p_user_id
      and n.type = p_type
      and coalesce(n.data->>'dedup_key', '') = p_dedup_key
      and n.created_at > now() - interval '36 hours'
    limit 1;

    if v_id is not null then
      return v_id;
    end if;
  end if;

  insert into public.notifications (
    user_id,
    gym_id,
    channel,
    title,
    body,
    type,
    audience_role,
    data,
    created_at
  )
  values (
    p_user_id,
    p_gym_id,
    p_channel,
    p_title,
    p_body,
    p_type,
    p_audience_role,
    case
      when p_dedup_key is null then p_data
      else p_data || jsonb_build_object('dedup_key', p_dedup_key)
    end,
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and user_id = auth.uid()
    and read_at is null;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.get_unread_notification_count()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.notifications
  where user_id = auth.uid()
    and read_at is null;
$$;

create or replace function public.upsert_push_token_with_role(
  p_user_id uuid,
  p_expo_push_token text,
  p_platform text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  select role into v_role from public.profiles where id = p_user_id;

  insert into public.push_tokens (user_id, expo_push_token, platform, role)
  values (p_user_id, p_expo_push_token, p_platform, coalesce(v_role, 'member'))
  on conflict (user_id, expo_push_token) do update
  set platform = excluded.platform,
      role = excluded.role,
      updated_at = now();
end;
$$;

create or replace function public.notify_checkin_success()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_name text;
begin
  select name into v_gym_name from public.gyms where id = new.gym_id;

  perform public.create_notification_record(
    new.user_id,
    'Check-in successful',
    format('You checked in at %s.', coalesce(v_gym_name, 'your gym')),
    'checkin_success',
    'member',
    new.gym_id,
    'in_app',
    jsonb_build_object('attendance_id', new.id),
    format('checkin:%s:%s', new.gym_id, (new.checked_in_at at time zone 'UTC')::date)
  );

  return new;
end;
$$;

drop trigger if exists trg_attendance_checkin_notify on public.attendance;
create trigger trg_attendance_checkin_notify
after insert on public.attendance
for each row execute function public.notify_checkin_success();

create or replace function public.notify_owner_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select name into v_gym_name from public.gyms where id = new.gym_id;

  perform public.create_notification_record(
    new.owner_id,
    'New membership request',
    format('A member requested to join %s.', coalesce(v_gym_name, 'your gym')),
    'owner_join_request',
    'owner',
    new.gym_id,
    'in_app',
    jsonb_build_object('request_id', new.id),
    format('join_request:%s', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_gym_member_request_notify on public.gym_member_requests;
create trigger trg_gym_member_request_notify
after insert on public.gym_member_requests
for each row execute function public.notify_owner_join_request();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.get_unread_notification_count() to authenticated;
grant execute on function public.upsert_push_token_with_role(uuid, text, text) to authenticated;
