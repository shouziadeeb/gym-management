-- Allow removed members to send a new connect/join request.
-- Fixes stale gym_join_requests.status = 'approved' after owner removes membership.

create or replace function public.is_active_gym_member(p_gym_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gym_memberships gm
    where gm.gym_id = p_gym_id
      and gm.user_id = p_user_id
      and gm.is_active = true
      and gm.left_at is null
  );
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
      and gjr.status = 'approved';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_gym_membership_removed_join_request on public.gym_memberships;
create trigger trg_gym_membership_removed_join_request
after update of is_active, left_at on public.gym_memberships
for each row execute function public.sync_join_request_on_membership_removed();

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

  insert into public.gym_join_requests (gym_id, user_id, source, status)
  values (p_gym_id, v_user_id, p_source, 'pending')
  on conflict (gym_id, user_id) do update set
    status = case
      when gym_join_requests.status in ('rejected', 'cancelled') then 'pending'::public.gym_join_request_status
      when gym_join_requests.status = 'approved'
        and not public.is_active_gym_member(p_gym_id, v_user_id)
        then 'pending'::public.gym_join_request_status
      else gym_join_requests.status
    end,
    source = excluded.source,
    responded_at = case
      when gym_join_requests.status in ('rejected', 'cancelled')
        or (
          gym_join_requests.status = 'approved'
          and not public.is_active_gym_member(p_gym_id, v_user_id)
        )
        then null
      else gym_join_requests.responded_at
    end,
    responded_by = case
      when gym_join_requests.status in ('rejected', 'cancelled')
        or (
          gym_join_requests.status = 'approved'
          and not public.is_active_gym_member(p_gym_id, v_user_id)
        )
        then null
      else gym_join_requests.responded_by
    end,
    updated_at = now()
  returning id into v_request_id;

  return jsonb_build_object('ok', true, 'status', 'pending', 'request_id', v_request_id, 'mode', 'approval');
end;
$$;

-- Backfill: clear stale approved join requests for users no longer active members.
update public.gym_join_requests gjr
set status = 'cancelled', updated_at = now()
where gjr.status = 'approved'
  and not public.is_active_gym_member(gjr.gym_id, gjr.user_id);

grant execute on function public.is_active_gym_member(uuid, uuid) to authenticated;
