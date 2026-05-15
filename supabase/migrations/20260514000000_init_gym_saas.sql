-- Gym SaaS: initial schema + RLS (Supabase PostgreSQL)
-- Multi-tenant: every row links to gym_id where applicable; access via membership + RLS.

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('owner', 'member', 'trainer', 'staff', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'expiring_soon', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_channel as enum ('push', 'email', 'sms', 'in_app');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Core tables
-- -----------------------------------------------------------------------------

-- Profiles extend auth.users (1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gyms (tenants)
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  address text,
  timezone text not null default 'UTC',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gyms_owner on public.gyms (owner_id);

-- User can belong to multiple gyms with different roles (SaaS)
create table if not exists public.gym_memberships (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_in_gym public.user_role not null default 'member',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (gym_id, user_id)
);

create index if not exists idx_gym_memberships_gym on public.gym_memberships (gym_id);
create index if not exists idx_gym_memberships_user on public.gym_memberships (user_id);

-- Billing product for the gym (optional granularity)
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  interval_months integer not null default 1 check (interval_months > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_membership_plans_gym on public.membership_plans (gym_id);

-- Per-user subscription at a gym (monthly MVP)
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid references public.membership_plans (id) on delete set null,
  status public.membership_status not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  renewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index if not exists idx_memberships_gym on public.memberships (gym_id);
create index if not exists idx_memberships_user on public.memberships (user_id);
create index if not exists idx_memberships_ends on public.memberships (ends_at);

-- Simplified payments log (integrate Stripe later)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  membership_id uuid references public.memberships (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  provider text,
  external_id text,
  paid_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_payments_gym_time on public.payments (gym_id, paid_at desc);

-- Notifications queue + history
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

-- Device tokens for Expo push
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  created_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

-- Attendance (scale: partition by month if needed later)
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  source text default 'mobile'
);

create index if not exists idx_attendance_gym_time on public.attendance (gym_id, checked_in_at desc);

-- Trainers (phase 2)
create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  bio text,
  specialties text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index if not exists idx_trainers_gym on public.trainers (gym_id);

-- Workout plans
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  trainer_id uuid references public.trainers (id) on delete set null,
  member_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  schedule jsonb not null default '[]'::jsonb,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workout_plans_gym on public.workout_plans (gym_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_gyms_updated on public.gyms;
create trigger trg_gyms_updated before update on public.gyms
for each row execute function public.set_updated_at();

drop trigger if exists trg_memberships_updated on public.memberships;
create trigger trg_memberships_updated before update on public.memberships
for each row execute function public.set_updated_at();

drop trigger if exists trg_workout_plans_updated on public.workout_plans;
create trigger trg_workout_plans_updated before update on public.workout_plans
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Membership status sync (computed on write; optional cron to refresh)
-- -----------------------------------------------------------------------------
create or replace function public.refresh_membership_status()
returns trigger
language plpgsql
as $$
declare
  days_left int;
begin
  days_left := (new.ends_at::date - (current_timestamp at time zone 'UTC')::date);
  if new.status = 'cancelled' then
    return new;
  end if;
  if new.ends_at < now() then
    new.status := 'expired';
  elsif days_left <= 3 then
    new.status := 'expiring_soon';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_memberships_status on public.memberships;
create trigger trg_memberships_status
before insert or update of ends_at, status on public.memberships
for each row execute function public.refresh_membership_status();

-- -----------------------------------------------------------------------------
-- Auth helpers for RLS
-- -----------------------------------------------------------------------------
create or replace function public.is_gym_owner(p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gyms g
    where g.id = p_gym_id and g.owner_id = auth.uid()
  );
$$;

create or replace function public.has_gym_access(p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gym_memberships gm
    where gm.gym_id = p_gym_id
      and gm.user_id = auth.uid()
      and gm.is_active = true
      and gm.left_at is null
  ) or public.is_gym_owner(p_gym_id);
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_memberships enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.attendance enable row level security;
alter table public.trainers enable row level security;
alter table public.workout_plans enable row level security;

-- Profiles: user reads/updates self
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- Gym owners need to see member profiles in their gym (via membership join in app or service role for admin dashboards)
drop policy if exists profiles_select_same_gym on public.profiles;
create policy profiles_select_same_gym on public.profiles
  for select using (
    exists (
      select 1 from public.gym_memberships gm1
      join public.gym_memberships gm2 on gm1.gym_id = gm2.gym_id
      where gm1.user_id = auth.uid()
        and gm2.user_id = profiles.id
        and gm1.is_active and gm2.is_active
        and gm1.left_at is null and gm2.left_at is null
    )
    or exists (
      select 1 from public.gyms g
      where g.owner_id = auth.uid() and exists (
        select 1 from public.gym_memberships gm
        where gm.gym_id = g.id and gm.user_id = profiles.id
      )
    )
  );

-- Gyms
drop policy if exists gyms_select_access on public.gyms;
create policy gyms_select_access on public.gyms
  for select using (public.has_gym_access(id) or owner_id = auth.uid());

drop policy if exists gyms_insert_owner on public.gyms;
create policy gyms_insert_owner on public.gyms
  for insert with check (owner_id = auth.uid());

drop policy if exists gyms_update_owner on public.gyms;
create policy gyms_update_owner on public.gyms
  for update using (owner_id = auth.uid());

drop policy if exists gyms_delete_owner on public.gyms;
create policy gyms_delete_owner on public.gyms
  for delete using (owner_id = auth.uid());

-- Gym memberships
drop policy if exists gym_memberships_select on public.gym_memberships;
create policy gym_memberships_select on public.gym_memberships
  for select using (
    user_id = auth.uid()
    or public.is_gym_owner(gym_id)
  );

drop policy if exists gym_memberships_manage_owner on public.gym_memberships;
create policy gym_memberships_manage_owner on public.gym_memberships
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

drop policy if exists gym_memberships_insert_self_leave on public.gym_memberships;
-- Members can insert their own link when accepting invite; owner adds others
create policy gym_memberships_insert_self_leave on public.gym_memberships
  for insert with check (user_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists gym_memberships_update_self on public.gym_memberships;
create policy gym_memberships_update_self on public.gym_memberships
  for update using (user_id = auth.uid() or public.is_gym_owner(gym_id));

-- Membership plans
drop policy if exists plans_all on public.membership_plans;
create policy plans_all on public.membership_plans
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

drop policy if exists plans_select_member on public.membership_plans;
create policy plans_select_member on public.membership_plans
  for select using (public.has_gym_access(gym_id));

-- Memberships (billing)
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists memberships_manage_owner on public.memberships;
create policy memberships_manage_owner on public.memberships
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

drop policy if exists memberships_insert_self_renew on public.memberships;
create policy memberships_insert_self_renew on public.memberships
  for insert with check (user_id = auth.uid() or public.is_gym_owner(gym_id));

-- Payments
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (user_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists payments_manage_owner on public.payments;
create policy payments_manage_owner on public.payments
  for insert with check (public.is_gym_owner(gym_id));

-- Notifications
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists notifications_insert_owner on public.notifications;
create policy notifications_insert_owner on public.notifications
  for insert with check (
    user_id = auth.uid()
    or (
      gym_id is not null
      and public.is_gym_owner(gym_id)
      and exists (
        select 1 from public.gym_memberships gm
        where gm.gym_id = gym_id
          and gm.user_id = user_id
          and gm.is_active
          and gm.left_at is null
      )
    )
  );

-- Push tokens
drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Attendance
drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select using (user_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists attendance_insert_self on public.attendance;
create policy attendance_insert_self on public.attendance
  for insert with check (
    user_id = auth.uid() and public.has_gym_access(gym_id)
  );

-- Trainers / workout plans (read for gym members, write owner/trainer later)
drop policy if exists trainers_select on public.trainers;
create policy trainers_select on public.trainers
  for select using (public.has_gym_access(gym_id));

drop policy if exists trainers_manage on public.trainers;
create policy trainers_manage on public.trainers
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

drop policy if exists workout_plans_select on public.workout_plans;
create policy workout_plans_select on public.workout_plans
  for select using (
    public.has_gym_access(gym_id)
    and (
      member_id is null or member_id = auth.uid()
      or public.is_gym_owner(gym_id)
    )
  );

drop policy if exists workout_plans_manage on public.workout_plans;
create policy workout_plans_manage on public.workout_plans
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

-- -----------------------------------------------------------------------------
-- Realtime (optional): add tables to supabase_realtime publication in dashboard
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- New user -> profile
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
