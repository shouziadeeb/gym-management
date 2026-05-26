-- Phase 7: Membership expiry and subscription lifecycle tracking.
-- Extends existing memberships table for scalable plan/payment lifecycle.

do $$ begin
  create type public.membership_plan_type as enum ('monthly', 'quarterly', 'yearly');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('paid', 'pending', 'failed', 'waived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_reminder_type as enum ('expiry_reminder', 'renewal_reminder', 'payment_reminder');
exception when duplicate_object then null;
end $$;

alter table public.memberships
  add column if not exists member_id uuid references public.profiles (id) on delete cascade,
  add column if not exists plan_type public.membership_plan_type not null default 'monthly',
  add column if not exists payment_status public.payment_status not null default 'paid',
  add column if not exists start_date date,
  add column if not exists expiry_date date;

update public.memberships
set
  member_id = coalesce(member_id, user_id),
  start_date = coalesce(start_date, (starts_at at time zone 'UTC')::date),
  expiry_date = coalesce(expiry_date, (ends_at at time zone 'UTC')::date)
where member_id is null
  or start_date is null
  or expiry_date is null;

alter table public.memberships
  alter column member_id set not null,
  alter column start_date set not null,
  alter column expiry_date set not null;

create index if not exists idx_memberships_gym_status_expiry on public.memberships (gym_id, status, expiry_date);
create index if not exists idx_memberships_member on public.memberships (member_id);
create index if not exists idx_memberships_expiry on public.memberships (expiry_date);

create table if not exists public.membership_renewals (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  previous_start_date date not null,
  previous_expiry_date date not null,
  new_start_date date not null,
  new_expiry_date date not null,
  plan_type public.membership_plan_type not null,
  payment_status public.payment_status not null default 'paid',
  amount_cents integer check (amount_cents >= 0),
  currency text not null default 'USD',
  renewed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_membership_renewals_membership on public.membership_renewals (membership_id, renewed_at desc);
create index if not exists idx_membership_renewals_gym on public.membership_renewals (gym_id, renewed_at desc);

create table if not exists public.membership_notification_events (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  reminder_type public.membership_reminder_type not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  channel public.notification_channel not null default 'in_app',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_membership_notification_events_queue
  on public.membership_notification_events (scheduled_for, status)
  where sent_at is null;

create or replace function public.sync_membership_subscription_columns()
returns trigger
language plpgsql
as $$
begin
  if new.member_id is null and new.user_id is not null then
    new.member_id := new.user_id;
  elsif new.user_id is null and new.member_id is not null then
    new.user_id := new.member_id;
  elsif new.member_id is distinct from new.user_id then
    new.user_id := new.member_id;
  end if;

  if new.start_date is null and new.starts_at is not null then
    new.start_date := (new.starts_at at time zone 'UTC')::date;
  end if;
  if new.expiry_date is null and new.ends_at is not null then
    new.expiry_date := (new.ends_at at time zone 'UTC')::date;
  end if;

  if new.starts_at is null and new.start_date is not null then
    new.starts_at := (new.start_date::text || 'T00:00:00Z')::timestamptz;
  end if;
  if new.ends_at is null and new.expiry_date is not null then
    new.ends_at := (new.expiry_date::text || 'T23:59:59Z')::timestamptz;
  end if;

  if new.starts_at is not null then
    new.start_date := (new.starts_at at time zone 'UTC')::date;
  end if;
  if new.ends_at is not null then
    new.expiry_date := (new.ends_at at time zone 'UTC')::date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_memberships_sync_subscription_columns on public.memberships;
create trigger trg_memberships_sync_subscription_columns
before insert or update on public.memberships
for each row execute function public.sync_membership_subscription_columns();

create or replace function public.refresh_membership_status()
returns trigger
language plpgsql
as $$
declare
  days_left int;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  days_left := (new.expiry_date - ((current_timestamp at time zone 'UTC')::date));

  if days_left < 0 then
    new.status := 'expired';
  elsif days_left <= 3 then
    new.status := 'expiring_soon';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$;

create or replace function public.refresh_membership_statuses(p_gym_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  with recalculated as (
    select
      id,
      case
        when status = 'cancelled' then 'cancelled'::public.membership_status
        when expiry_date < ((current_timestamp at time zone 'UTC')::date) then 'expired'::public.membership_status
        when expiry_date <= ((current_timestamp at time zone 'UTC')::date + 3) then 'expiring_soon'::public.membership_status
        else 'active'::public.membership_status
      end as next_status
    from public.memberships
    where (p_gym_id is null or gym_id = p_gym_id)
  )
  update public.memberships m
  set status = r.next_status
  from recalculated r
  where m.id = r.id
    and m.status is distinct from r.next_status;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

alter table public.membership_renewals enable row level security;
alter table public.membership_notification_events enable row level security;

drop policy if exists membership_renewals_select on public.membership_renewals;
create policy membership_renewals_select on public.membership_renewals
  for select using (member_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists membership_renewals_insert_owner on public.membership_renewals;
create policy membership_renewals_insert_owner on public.membership_renewals
  for insert with check (public.is_gym_owner(gym_id));

drop policy if exists membership_notifications_select on public.membership_notification_events;
create policy membership_notifications_select on public.membership_notification_events
  for select using (member_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists membership_notifications_insert_owner on public.membership_notification_events;
create policy membership_notifications_insert_owner on public.membership_notification_events
  for insert with check (public.is_gym_owner(gym_id));

drop policy if exists membership_notifications_update_owner on public.membership_notification_events;
create policy membership_notifications_update_owner on public.membership_notification_events
  for update using (public.is_gym_owner(gym_id));
