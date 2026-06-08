-- QR join, deep-link analytics, and attendance QR normalization.
-- Extends existing attendance_token on gyms; adds member-initiated join flow.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.gym_join_mode as enum ('instant', 'approval', 'invite_only');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.gym_join_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.gym_join_source as enum ('qr_scan', 'deep_link', 'web', 'app', 'owner_invite');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.deep_link_event_type as enum (
    'qr_scan_join',
    'qr_scan_attendance',
    'join_conversion',
    'join_approved',
    'join_rejected',
    'attendance_success',
    'attendance_failed',
    'install_prompt_shown',
    'install_conversion'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- gym_qr_codes — join QR configuration (1:1 with gym)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_qr_codes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null unique references public.gyms (id) on delete cascade,
  join_token text unique,
  join_enabled boolean not null default true,
  join_mode public.gym_join_mode not null default 'approval',
  expires_at timestamptz,
  qr_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gym_qr_codes_gym on public.gym_qr_codes (gym_id);
create index if not exists idx_gym_qr_codes_join_token
  on public.gym_qr_codes (join_token)
  where join_token is not null;

-- ---------------------------------------------------------------------------
-- attendance_qr_codes — normalized view of attendance QR (synced from gyms)
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_qr_codes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null unique references public.gyms (id) on delete cascade,
  token text unique,
  enabled boolean not null default false,
  duplicate_window_minutes integer not null default 1440 check (duplicate_window_minutes > 0),
  qr_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attendance_qr_codes_token
  on public.attendance_qr_codes (token)
  where token is not null;

-- Backfill from existing gyms.attendance_token
insert into public.attendance_qr_codes (gym_id, token, enabled, qr_generated_at)
select g.id, g.attendance_token, coalesce(g.attendance_enabled, false), g.qr_generated_at
from public.gyms g
where g.attendance_token is not null
on conflict (gym_id) do update set
  token = excluded.token,
  enabled = excluded.enabled,
  qr_generated_at = excluded.qr_generated_at,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- gym_join_requests — member-initiated join (via QR / web / app)
-- Distinct from gym_member_requests (owner-initiated invite).
-- ---------------------------------------------------------------------------
create table if not exists public.gym_join_requests (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.gym_join_request_status not null default 'pending',
  source public.gym_join_source not null default 'qr_scan',
  responded_at timestamptz,
  responded_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index if not exists idx_gym_join_requests_gym_status
  on public.gym_join_requests (gym_id, status, created_at desc);
create index if not exists idx_gym_join_requests_user
  on public.gym_join_requests (user_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- deep_link_events — analytics (insert-only, minimal PII)
-- ---------------------------------------------------------------------------
create table if not exists public.deep_link_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.deep_link_event_type not null,
  gym_id uuid references public.gyms (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  platform text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_deep_link_events_gym_type
  on public.deep_link_events (gym_id, event_type, created_at desc);
create index if not exists idx_deep_link_events_created
  on public.deep_link_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists trg_gym_qr_codes_updated on public.gym_qr_codes;
create trigger trg_gym_qr_codes_updated before update on public.gym_qr_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_attendance_qr_codes_updated on public.attendance_qr_codes;
create trigger trg_attendance_qr_codes_updated before update on public.attendance_qr_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_gym_join_requests_updated on public.gym_join_requests;
create trigger trg_gym_join_requests_updated before update on public.gym_join_requests
for each row execute function public.set_updated_at();

-- Sync attendance_qr_codes when owner upserts gyms.attendance_token
create or replace function public.sync_attendance_qr_codes_from_gym()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.attendance_token is null then
    delete from public.attendance_qr_codes where gym_id = new.id;
    return new;
  end if;

  insert into public.attendance_qr_codes (gym_id, token, enabled, qr_generated_at)
  values (new.id, new.attendance_token, coalesce(new.attendance_enabled, false), new.qr_generated_at)
  on conflict (gym_id) do update set
    token = excluded.token,
    enabled = excluded.enabled,
    qr_generated_at = excluded.qr_generated_at,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_gyms_sync_attendance_qr on public.gyms;
create trigger trg_gyms_sync_attendance_qr
after insert or update of attendance_token, attendance_enabled, qr_generated_at on public.gyms
for each row execute function public.sync_attendance_qr_codes_from_gym();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.generate_join_token()
returns text
language sql
volatile
as $$
  select 'gjt_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

-- ---------------------------------------------------------------------------
-- RPC: resolve gym join context (public slug landing)
-- ---------------------------------------------------------------------------
create or replace function public.resolve_gym_join_context(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym public.gyms%rowtype;
  v_qr public.gym_qr_codes%rowtype;
  v_user_id uuid := auth.uid();
  v_is_member boolean := false;
  v_join_status public.gym_join_request_status;
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_SLUG');
  end if;

  select * into v_gym
  from public.gyms g
  where lower(g.slug) = lower(trim(p_slug))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'GYM_NOT_FOUND');
  end if;

  if coalesce(v_gym.is_active, true) = false then
    return jsonb_build_object('ok', false, 'error', 'GYM_INACTIVE');
  end if;

  select * into v_qr from public.gym_qr_codes where gym_id = v_gym.id;

  if v_qr.id is not null and not v_qr.join_enabled then
    return jsonb_build_object('ok', false, 'error', 'JOIN_DISABLED');
  end if;

  if v_qr.expires_at is not null and v_qr.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'JOIN_LINK_EXPIRED');
  end if;

  if v_user_id is not null then
    select exists (
      select 1 from public.gym_memberships gm
      where gm.gym_id = v_gym.id and gm.user_id = v_user_id
        and gm.is_active = true and gm.left_at is null
    ) into v_is_member;

    select gjr.status into v_join_status
    from public.gym_join_requests gjr
    where gjr.gym_id = v_gym.id and gjr.user_id = v_user_id
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'gym_id', v_gym.id,
    'slug', v_gym.slug,
    'name', v_gym.name,
    'description', v_gym.description,
    'logo_url', v_gym.logo_url,
    'address', v_gym.address,
    'join_mode', coalesce(v_qr.join_mode, 'approval'::public.gym_join_mode),
    'is_member', v_is_member,
    'join_request_status', v_join_status
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create member-initiated join request
-- ---------------------------------------------------------------------------
create or replace function public.create_gym_join_request(
  p_gym_id uuid,
  p_source public.gym_join_source default 'qr_scan'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_gym public.gyms%rowtype;
  v_qr public.gym_qr_codes%rowtype;
  v_request_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;

  select * into v_gym from public.gyms where id = p_gym_id;
  if not found or coalesce(v_gym.is_active, true) = false then
    return jsonb_build_object('ok', false, 'error', 'GYM_INACTIVE');
  end if;

  select * into v_qr from public.gym_qr_codes where gym_id = p_gym_id;

  if coalesce(v_qr.join_mode, 'approval'::public.gym_join_mode) = 'invite_only' then
    return jsonb_build_object('ok', false, 'error', 'INVITE_ONLY');
  end if;

  if exists (
    select 1 from public.gym_memberships gm
    where gm.gym_id = p_gym_id and gm.user_id = v_user_id
      and gm.is_active = true and gm.left_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_MEMBER');
  end if;

  if coalesce(v_qr.join_mode, 'approval'::public.gym_join_mode) = 'instant' then
    insert into public.gym_memberships (gym_id, user_id, role_in_gym, is_active)
    values (p_gym_id, v_user_id, 'member', true)
    on conflict (gym_id, user_id) do update set
      is_active = true,
      left_at = null,
      joined_at = now();

    return jsonb_build_object('ok', true, 'status', 'active', 'mode', 'instant');
  end if;

  insert into public.gym_join_requests (gym_id, user_id, source, status)
  values (p_gym_id, v_user_id, p_source, 'pending')
  on conflict (gym_id, user_id) do update set
    status = case
      when gym_join_requests.status in ('rejected', 'cancelled') then 'pending'::public.gym_join_request_status
      else gym_join_requests.status
    end,
    source = excluded.source,
    updated_at = now()
  returning id into v_request_id;

  return jsonb_build_object('ok', true, 'status', 'pending', 'request_id', v_request_id, 'mode', 'approval');
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: owner approve/reject join request
-- ---------------------------------------------------------------------------
create or replace function public.owner_respond_join_request(
  p_request_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.gym_join_requests%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;

  select * into v_req from public.gym_join_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;

  if not public.is_gym_owner(v_req.gym_id) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;

  if v_req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_RESPONDED');
  end if;

  if lower(p_decision) = 'approve' then
    update public.gym_join_requests
    set status = 'approved', responded_at = now(), responded_by = auth.uid()
    where id = p_request_id;

    insert into public.gym_memberships (gym_id, user_id, role_in_gym, is_active)
    values (v_req.gym_id, v_req.user_id, 'member', true)
    on conflict (gym_id, user_id) do update set
      is_active = true,
      left_at = null,
      joined_at = now();

    return jsonb_build_object('ok', true, 'status', 'approved');
  elsif lower(p_decision) = 'reject' then
    update public.gym_join_requests
    set status = 'rejected', responded_at = now(), responded_by = auth.uid()
    where id = p_request_id;

    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;

  return jsonb_build_object('ok', false, 'error', 'INVALID_DECISION');
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: owner upsert join QR
-- ---------------------------------------------------------------------------
create or replace function public.owner_upsert_join_qr(
  p_gym_id uuid,
  p_regenerate boolean default false,
  p_join_mode public.gym_join_mode default 'approval'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHORIZED');
  end if;

  if not public.is_gym_owner(p_gym_id) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;

  select gqc.join_token into v_token from public.gym_qr_codes gqc where gqc.gym_id = p_gym_id;

  if v_token is null or p_regenerate then
    v_token := public.generate_join_token();
  end if;

  insert into public.gym_qr_codes (gym_id, join_token, join_enabled, join_mode, qr_generated_at)
  values (p_gym_id, v_token, true, p_join_mode, v_now)
  on conflict (gym_id) do update set
    join_token = excluded.join_token,
    join_enabled = true,
    join_mode = excluded.join_mode,
    qr_generated_at = v_now,
    updated_at = v_now;

  return jsonb_build_object(
    'ok', true,
    'join_token', v_token,
    'slug', (select slug from public.gyms where id = p_gym_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: record deep link analytics event
-- ---------------------------------------------------------------------------
create or replace function public.record_deep_link_event(
  p_event_type public.deep_link_event_type,
  p_gym_id uuid default null,
  p_platform text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.deep_link_events (event_type, gym_id, user_id, platform, metadata)
  values (p_event_type, p_gym_id, auth.uid(), p_platform, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.gym_qr_codes enable row level security;
alter table public.attendance_qr_codes enable row level security;
alter table public.gym_join_requests enable row level security;
alter table public.deep_link_events enable row level security;

-- gym_qr_codes: owners manage; public cannot read tokens
drop policy if exists gym_qr_codes_owner_all on public.gym_qr_codes;
create policy gym_qr_codes_owner_all on public.gym_qr_codes
  for all using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

-- attendance_qr_codes: owners read; members never see token via direct select
drop policy if exists attendance_qr_codes_owner_select on public.attendance_qr_codes;
create policy attendance_qr_codes_owner_select on public.attendance_qr_codes
  for select using (public.is_gym_owner(gym_id));

-- gym_join_requests
drop policy if exists gym_join_requests_select on public.gym_join_requests;
create policy gym_join_requests_select on public.gym_join_requests
  for select using (user_id = auth.uid() or public.is_gym_owner(gym_id));

drop policy if exists gym_join_requests_insert on public.gym_join_requests;
create policy gym_join_requests_insert on public.gym_join_requests
  for insert with check (user_id = auth.uid());

drop policy if exists gym_join_requests_update on public.gym_join_requests;
create policy gym_join_requests_update on public.gym_join_requests
  for update using (user_id = auth.uid() or public.is_gym_owner(gym_id));

-- deep_link_events: anyone can insert (via RPC); owners read gym events
drop policy if exists deep_link_events_insert on public.deep_link_events;
create policy deep_link_events_insert on public.deep_link_events
  for insert with check (true);

drop policy if exists deep_link_events_owner_select on public.deep_link_events;
create policy deep_link_events_owner_select on public.deep_link_events
  for select using (
    gym_id is null
    or public.is_gym_owner(gym_id)
    or user_id = auth.uid()
  );

-- Grant execute on RPCs
grant execute on function public.resolve_gym_join_context(text) to anon, authenticated;
grant execute on function public.create_gym_join_request(uuid, public.gym_join_source) to authenticated;
grant execute on function public.owner_respond_join_request(uuid, text) to authenticated;
grant execute on function public.owner_upsert_join_qr(uuid, boolean, public.gym_join_mode) to authenticated;
grant execute on function public.record_deep_link_event(public.deep_link_event_type, uuid, text, jsonb) to anon, authenticated;
