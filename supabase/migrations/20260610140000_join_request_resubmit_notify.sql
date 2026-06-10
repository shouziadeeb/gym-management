-- Fix stale join requests, re-notify owners on resubmit, cancel pending on member removal.

create or replace function public.notify_owner_for_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.gym_join_requests%rowtype;
  v_owner_id uuid;
  v_gym_name text;
  v_requester_name text;
begin
  select * into v_req from public.gym_join_requests where id = p_request_id;
  if not found or v_req.status <> 'pending' then
    return;
  end if;

  select g.owner_id, g.name
  into v_owner_id, v_gym_name
  from public.gyms g
  where g.id = v_req.gym_id;

  if v_owner_id is null then
    return;
  end if;

  select p.full_name into v_requester_name
  from public.profiles p
  where p.id = v_req.user_id;

  perform public.create_notification_record(
    v_owner_id,
    'New join request',
    format(
      '%s requested to join %s.',
      coalesce(nullif(trim(v_requester_name), ''), 'A member'),
      coalesce(nullif(trim(v_gym_name), ''), 'your gym')
    ),
    'owner_join_request',
    'owner',
    v_req.gym_id,
    'in_app',
    jsonb_build_object(
      'request_id', v_req.id,
      'gym_id', v_req.gym_id,
      'user_id', v_req.user_id
    ),
    format(
      'gym_join_request:%s:%s',
      v_req.id,
      to_char(timezone('UTC', now()), 'YYYYMMDDHH24MISS')
    )
  );
end;
$$;

create or replace function public.sync_join_request_on_membership_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and coalesce(old.is_active, false) = true
    and old.left_at is null
    and (coalesce(new.is_active, false) = false or new.left_at is not null)
  then
    update public.gym_join_requests gjr
    set
      status = 'cancelled',
      updated_at = now()
    where gjr.gym_id = new.gym_id
      and gjr.user_id = new.user_id
      and gjr.status in ('approved', 'pending');
  end if;

  return new;
end;
$$;

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
  v_existing_status public.gym_join_request_status;
  v_should_notify boolean := false;
  v_reopen_request boolean := false;
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

  if public.is_active_gym_member(p_gym_id, v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_MEMBER');
  end if;

  if coalesce(v_qr.join_mode, 'approval'::public.gym_join_mode) = 'instant' then
    insert into public.gym_memberships (gym_id, user_id, role_in_gym, is_active)
    values (p_gym_id, v_user_id, 'member', true)
    on conflict (gym_id, user_id) do update set
      is_active = true,
      left_at = null,
      joined_at = now();

    update public.gym_join_requests gjr
    set status = 'approved', updated_at = now(), responded_at = now()
    where gjr.gym_id = p_gym_id and gjr.user_id = v_user_id;

    return jsonb_build_object('ok', true, 'status', 'active', 'mode', 'instant');
  end if;

  select gjr.status
  into v_existing_status
  from public.gym_join_requests gjr
  where gjr.gym_id = p_gym_id and gjr.user_id = v_user_id;

  v_reopen_request := v_existing_status is null
    or v_existing_status in ('rejected', 'cancelled')
    or (v_existing_status = 'approved' and not public.is_active_gym_member(p_gym_id, v_user_id))
    or (v_existing_status = 'pending' and not public.is_active_gym_member(p_gym_id, v_user_id));

  insert into public.gym_join_requests (gym_id, user_id, source, status)
  values (p_gym_id, v_user_id, p_source, 'pending')
  on conflict (gym_id, user_id) do update set
    status = case
      when gym_join_requests.status in ('rejected', 'cancelled') then 'pending'::public.gym_join_request_status
      when gym_join_requests.status = 'approved'
        and not public.is_active_gym_member(p_gym_id, v_user_id)
        then 'pending'::public.gym_join_request_status
      when gym_join_requests.status = 'pending'
        and not public.is_active_gym_member(p_gym_id, v_user_id)
        then 'pending'::public.gym_join_request_status
      else gym_join_requests.status
    end,
    source = excluded.source,
    created_at = case
      when v_reopen_request then now()
      else gym_join_requests.created_at
    end,
    responded_at = case
      when v_reopen_request then null
      else gym_join_requests.responded_at
    end,
    responded_by = case
      when v_reopen_request then null
      else gym_join_requests.responded_by
    end,
    updated_at = now()
  returning id into v_request_id;

  -- Only RPC-notify when refreshing an already-pending row (status column unchanged).
  -- New inserts and status transitions are handled by trg_gym_join_request_owner_notify.
  v_should_notify := v_existing_status = 'pending' and v_reopen_request;

  if v_should_notify then
    perform public.notify_owner_for_join_request(v_request_id);
  end if;

  return jsonb_build_object('ok', true, 'status', 'pending', 'request_id', v_request_id, 'mode', 'approval');
end;
$$;

create or replace function public.notify_owner_gym_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'pending' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'pending' then
    return new;
  end if;

  perform public.notify_owner_for_join_request(new.id);
  return new;
end;
$$;

-- Clear stale pending requests for users who are no longer active members.
update public.gym_join_requests gjr
set status = 'cancelled', updated_at = now()
where gjr.status = 'pending'
  and not public.is_active_gym_member(gjr.gym_id, gjr.user_id);

grant execute on function public.notify_owner_for_join_request(uuid) to authenticated;
