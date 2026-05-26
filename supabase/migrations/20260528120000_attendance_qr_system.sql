-- QR / barcode attendance system
-- Adds gym attendance tokens, extends attendance records, RPCs, and RLS.

-- ---------------------------------------------------------------------------
-- Gyms: attendance QR configuration
-- ---------------------------------------------------------------------------
alter table public.gyms
  add column if not exists attendance_token text,
  add column if not exists attendance_enabled boolean not null default false,
  add column if not exists qr_generated_at timestamptz;

create unique index if not exists idx_gyms_attendance_token
  on public.gyms (attendance_token)
  where attendance_token is not null;

-- ---------------------------------------------------------------------------
-- Attendance: extended columns (backward compatible with checked_in_at)
-- ---------------------------------------------------------------------------
alter table public.attendance
  add column if not exists member_id uuid references public.profiles (id) on delete cascade,
  add column if not exists scanned_token text,
  add column if not exists attendance_date date,
  add column if not exists attendance_time timestamptz,
  add column if not exists created_at timestamptz not null default now();

update public.attendance
set
  member_id = coalesce(member_id, user_id),
  attendance_date = coalesce(attendance_date, (checked_in_at at time zone 'UTC')::date),
  attendance_time = coalesce(attendance_time, checked_in_at),
  created_at = coalesce(created_at, checked_in_at)
where member_id is null
   or attendance_date is null
   or attendance_time is null;

delete from public.attendance a
using public.attendance b
where a.id > b.id
  and a.gym_id = b.gym_id
  and a.user_id = b.user_id
  and a.attendance_date is not null
  and a.attendance_date = b.attendance_date;

alter table public.attendance
  alter column member_id set default auth.uid();

create unique index if not exists idx_attendance_unique_daily
  on public.attendance (gym_id, user_id, attendance_date);

create index if not exists idx_attendance_gym_date
  on public.attendance (gym_id, attendance_date desc, attendance_time desc);

create index if not exists idx_attendance_member_history
  on public.attendance (member_id, gym_id, attendance_date desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.generate_attendance_token()
returns text
language sql
volatile
as $$
  select 'gat_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

create or replace function public.gym_local_date(p_gym_id uuid, p_moment timestamptz default now())
returns date
language sql
stable
as $$
  select (p_moment at time zone coalesce(
    (select timezone from public.gyms where id = p_gym_id),
    'UTC'
  ))::date;
$$;

-- ---------------------------------------------------------------------------
-- Owner: generate / regenerate / disable / delete attendance QR
-- ---------------------------------------------------------------------------
create or replace function public.owner_upsert_attendance_qr(
  p_gym_id uuid,
  p_regenerate boolean
)
returns table (
  attendance_token text,
  attendance_enabled boolean,
  qr_generated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  select g.attendance_token into v_token
  from public.gyms g
  where g.id = p_gym_id;

  if v_token is null or p_regenerate then
    v_token := public.generate_attendance_token();
  end if;

  update public.gyms
  set
    attendance_token = v_token,
    attendance_enabled = true,
    qr_generated_at = v_now,
    updated_at = v_now
  where id = p_gym_id;

  return query
  select g.attendance_token, g.attendance_enabled, g.qr_generated_at
  from public.gyms g
  where g.id = p_gym_id;
end;
$$;

create or replace function public.owner_set_attendance_enabled(
  p_gym_id uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  update public.gyms
  set attendance_enabled = p_enabled, updated_at = now()
  where id = p_gym_id;

  return p_enabled;
end;
$$;

create or replace function public.owner_delete_attendance_qr(p_gym_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  update public.gyms
  set
    attendance_token = null,
    attendance_enabled = false,
    qr_generated_at = null,
    updated_at = now()
  where id = p_gym_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Member: mark attendance via scanned token (server-side validation)
-- ---------------------------------------------------------------------------
create or replace function public.mark_attendance_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_gym public.gyms%rowtype;
  v_link public.gym_memberships%rowtype;
  v_membership public.memberships%rowtype;
  v_today date;
  v_now timestamptz := now();
  v_attendance_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_QR');
  end if;

  select * into v_gym
  from public.gyms
  where attendance_token = trim(p_token);

  if not found then
    return jsonb_build_object('success', false, 'error', 'INVALID_QR');
  end if;

  if coalesce(v_gym.is_active, true) = false then
    return jsonb_build_object('success', false, 'error', 'GYM_INACTIVE');
  end if;

  if not coalesce(v_gym.attendance_enabled, false) then
    return jsonb_build_object('success', false, 'error', 'ATTENDANCE_DISABLED');
  end if;

  select * into v_link
  from public.gym_memberships gm
  where gm.gym_id = v_gym.id
    and gm.user_id = v_user_id
    and gm.is_active = true
    and gm.left_at is null;

  if not found then
    return jsonb_build_object('success', false, 'error', 'NOT_A_MEMBER');
  end if;

  select * into v_membership
  from public.memberships m
  where m.gym_id = v_gym.id
    and m.user_id = v_user_id;

  if not found or v_membership.status not in ('active', 'expiring_soon') then
    return jsonb_build_object('success', false, 'error', 'MEMBERSHIP_EXPIRED');
  end if;

  v_today := public.gym_local_date(v_gym.id, v_now);

  if exists (
    select 1
    from public.attendance a
    where a.gym_id = v_gym.id
      and a.user_id = v_user_id
      and a.attendance_date = v_today
  ) then
    return jsonb_build_object('success', false, 'error', 'ALREADY_MARKED');
  end if;

  insert into public.attendance (
    gym_id,
    user_id,
    member_id,
    scanned_token,
    attendance_date,
    attendance_time,
    checked_in_at,
    created_at,
    source
  )
  values (
    v_gym.id,
    v_user_id,
    v_user_id,
    trim(p_token),
    v_today,
    v_now,
    v_now,
    v_now,
    'qr_scan'
  )
  returning id into v_attendance_id;

  return jsonb_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'gym_id', v_gym.id,
    'gym_name', v_gym.name,
    'attendance_date', v_today,
    'attendance_time', v_now
  );
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'ALREADY_MARKED');
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner: today's attendance + paginated history
-- ---------------------------------------------------------------------------
create or replace function public.get_gym_today_attendance(
  p_gym_id uuid,
  p_date date default null
)
returns table (
  id uuid,
  member_id uuid,
  member_name text,
  member_phone text,
  avatar_url text,
  attendance_date date,
  attendance_time timestamptz,
  scanned_token text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, public.gym_local_date(p_gym_id));
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    a.id,
    a.member_id,
    p.full_name,
    p.phone,
    p.avatar_url,
    a.attendance_date,
    a.attendance_time,
    a.scanned_token,
    a.created_at
  from public.attendance a
  join public.profiles p on p.id = a.member_id
  where a.gym_id = p_gym_id
    and a.attendance_date = v_date
  order by a.attendance_time desc;
end;
$$;

create or replace function public.get_gym_attendance_history(
  p_gym_id uuid,
  p_from date default null,
  p_to date default null,
  p_member_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  member_id uuid,
  member_name text,
  member_phone text,
  avatar_url text,
  attendance_date date,
  attendance_time timestamptz,
  scanned_token text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with filtered as (
    select a.*
    from public.attendance a
    where a.gym_id = p_gym_id
      and (p_from is null or a.attendance_date >= p_from)
      and (p_to is null or a.attendance_date <= p_to)
      and (p_member_id is null or a.member_id = p_member_id)
  ),
  counted as (
    select count(*)::bigint as total from filtered
  )
  select
    f.id,
    f.member_id,
    p.full_name,
    p.phone,
    p.avatar_url,
    f.attendance_date,
    f.attendance_time,
    f.scanned_token,
    f.created_at,
    c.total
  from filtered f
  join public.profiles p on p.id = f.member_id
  cross join counted c
  order by f.attendance_date desc, f.attendance_time desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function public.get_member_attendance_history(
  p_gym_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  gym_id uuid,
  gym_name text,
  attendance_date date,
  attendance_time timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  return query
  with filtered as (
    select a.*
    from public.attendance a
    where a.user_id = v_user_id
      and (p_gym_id is null or a.gym_id = p_gym_id)
  ),
  counted as (
    select count(*)::bigint as total from filtered
  )
  select
    f.id,
    f.gym_id,
    g.name,
    f.attendance_date,
    f.attendance_time,
    f.created_at,
    c.total
  from filtered f
  join public.gyms g on g.id = f.gym_id
  cross join counted c
  order by f.attendance_date desc, f.attendance_time desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function public.owner_delete_attendance_record(
  p_attendance_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select gym_id into v_gym_id
  from public.attendance
  where id = p_attendance_id;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if not public.is_gym_owner(v_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  delete from public.attendance where id = p_attendance_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS updates
-- ---------------------------------------------------------------------------
drop policy if exists attendance_delete_owner on public.attendance;
create policy attendance_delete_owner on public.attendance
  for delete using (public.is_gym_owner(gym_id));

-- Restrict direct inserts — prefer mark_attendance_by_token RPC
drop policy if exists attendance_insert_self on public.attendance;
create policy attendance_insert_self on public.attendance
  for insert with check (false);

-- Owners can read attendance token for their gyms (for QR display)
drop policy if exists gyms_select_owner_attendance on public.gyms;
-- existing gyms_select policies should cover owner select; ensure owner can update attendance fields via existing gyms_update_owner

grant execute on function public.generate_attendance_token() to authenticated;
grant execute on function public.owner_upsert_attendance_qr(uuid, boolean) to authenticated;
grant execute on function public.owner_set_attendance_enabled(uuid, boolean) to authenticated;
grant execute on function public.owner_delete_attendance_qr(uuid) to authenticated;
grant execute on function public.mark_attendance_by_token(text) to authenticated;
grant execute on function public.get_gym_today_attendance(uuid, date) to authenticated;
grant execute on function public.get_gym_attendance_history(uuid, date, date, uuid, integer, integer) to authenticated;
grant execute on function public.get_member_attendance_history(uuid, integer, integer) to authenticated;
grant execute on function public.owner_delete_attendance_record(uuid) to authenticated;
grant execute on function public.owner_delete_attendance_record(uuid) to service_role;

notify pgrst, 'reload schema';
