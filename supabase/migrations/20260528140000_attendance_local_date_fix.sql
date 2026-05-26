-- Fix attendance_date to respect member local calendar day (timezone mismatch with UTC gyms).

drop function if exists public.mark_attendance_by_token(text);

create or replace function public.mark_attendance_by_token(
  p_token text,
  p_local_date date default null
)
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
  v_gym_date date;
  v_utc_date date;
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

  v_gym_date := public.gym_local_date(v_gym.id, v_now);
  v_utc_date := (v_now at time zone 'UTC')::date;

  if p_local_date is not null and p_local_date between (v_utc_date - 1) and (v_utc_date + 1) then
    v_today := p_local_date;
  else
    v_today := v_gym_date;
  end if;

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

-- Backfill existing rows where UTC date label disagrees with India local calendar day.
update public.attendance
set attendance_date = (attendance_time at time zone 'Asia/Kolkata')::date
where attendance_date is distinct from (attendance_time at time zone 'Asia/Kolkata')::date;

grant execute on function public.mark_attendance_by_token(text, date) to authenticated;
grant execute on function public.mark_attendance_by_token(text, date) to service_role;

notify pgrst, 'reload schema';
