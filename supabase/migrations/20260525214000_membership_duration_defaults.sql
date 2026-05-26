-- Membership duration defaults and plan options enhancement.
-- Adds half-yearly support + request plan capture + membership bootstrap.

do $$ begin
  alter type public.membership_plan_type add value if not exists 'half_yearly';
exception when duplicate_object then null;
end $$;

alter table public.gym_member_requests
  add column if not exists plan_type public.membership_plan_type not null default 'monthly';

create or replace function public.get_owner_gym_members(
  p_gym_id uuid,
  p_search text default null,
  p_status public.membership_status default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  membership_link_id uuid,
  gym_id uuid,
  member_id uuid,
  member_name text,
  member_phone text,
  avatar_url text,
  joined_at timestamptz,
  membership_id uuid,
  membership_status public.membership_status,
  payment_status public.payment_status,
  plan_type public.membership_plan_type,
  expiry_date date,
  remaining_days integer,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_gym_owner(p_gym_id) then
    raise exception 'Not authorized to access this gym members';
  end if;

  return query
  with base as (
    select
      gm.id as membership_link_id,
      gm.gym_id,
      gm.user_id as member_id,
      p.full_name as member_name,
      p.phone as member_phone,
      p.avatar_url,
      gm.joined_at,
      m.id as membership_id,
      coalesce(
        m.status,
        case
          when ((gm.joined_at at time zone 'UTC')::date + 30) < ((current_timestamp at time zone 'UTC')::date) then 'expired'::public.membership_status
          when ((gm.joined_at at time zone 'UTC')::date + 30) <= ((current_timestamp at time zone 'UTC')::date + 3) then 'expiring_soon'::public.membership_status
          else 'active'::public.membership_status
        end
      ) as membership_status,
      coalesce(m.payment_status, 'paid'::public.payment_status) as payment_status,
      coalesce(m.plan_type, 'monthly'::public.membership_plan_type) as plan_type,
      coalesce(m.expiry_date, ((gm.joined_at at time zone 'UTC')::date + 30)) as expiry_date,
      (
        coalesce(m.expiry_date, ((gm.joined_at at time zone 'UTC')::date + 30))
        - ((current_timestamp at time zone 'UTC')::date)
      )::integer as remaining_days
    from public.gym_memberships gm
    join public.profiles p on p.id = gm.user_id
    left join public.memberships m
      on m.gym_id = gm.gym_id
      and m.member_id = gm.user_id
    where gm.gym_id = p_gym_id
      and gm.is_active = true
      and gm.left_at is null
      and (
        p_search is null
        or p_search = ''
        or coalesce(p.full_name, '') ilike '%' || p_search || '%'
        or coalesce(p.phone, '') ilike '%' || p_search || '%'
      )
      and (
        p_status is null
        or coalesce(
          m.status,
          case
            when ((gm.joined_at at time zone 'UTC')::date + 30) < ((current_timestamp at time zone 'UTC')::date) then 'expired'::public.membership_status
            when ((gm.joined_at at time zone 'UTC')::date + 30) <= ((current_timestamp at time zone 'UTC')::date + 3) then 'expiring_soon'::public.membership_status
            else 'active'::public.membership_status
          end
        ) = p_status
      )
  )
  select
    base.*,
    count(*) over()::bigint as total_count
  from base
  order by base.joined_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

create or replace function public.respond_to_gym_member_request(
  p_request_id uuid,
  p_decision public.gym_member_request_status
)
returns public.gym_member_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.gym_member_requests;
  duration_days integer;
  start_date date;
  end_date date;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'Invalid decision';
  end if;

  select *
  into req
  from public.gym_member_requests
  where id = p_request_id
  for update;

  if req.id is null then
    raise exception 'Request not found';
  end if;

  if req.member_id <> auth.uid() then
    raise exception 'Only requested member can respond';
  end if;

  if req.status <> 'pending' then
    return req;
  end if;

  update public.gym_member_requests
  set
    status = p_decision,
    responded_at = now()
  where id = req.id
  returning * into req;

  if p_decision = 'accepted' then
    insert into public.gym_memberships (gym_id, user_id, role_in_gym, is_active, left_at, joined_at)
    values (req.gym_id, req.member_id, 'member', true, null, now())
    on conflict (gym_id, user_id) do update
      set is_active = true,
          left_at = null,
          joined_at = now();

    duration_days := case req.plan_type
      when 'monthly' then 30
      when 'quarterly' then 90
      when 'half_yearly' then 180
      when 'yearly' then 365
      else 30
    end;

    start_date := (current_timestamp at time zone 'UTC')::date;
    end_date := start_date + duration_days;

    insert into public.memberships (
      gym_id,
      user_id,
      member_id,
      plan_type,
      payment_status,
      start_date,
      expiry_date,
      starts_at,
      ends_at,
      status
    )
    values (
      req.gym_id,
      req.member_id,
      req.member_id,
      req.plan_type,
      'paid',
      start_date,
      end_date,
      (start_date::text || 'T00:00:00Z')::timestamptz,
      (end_date::text || 'T23:59:59Z')::timestamptz,
      'active'
    )
    on conflict (gym_id, user_id) do update
      set member_id = excluded.member_id,
          plan_type = excluded.plan_type,
          payment_status = excluded.payment_status,
          start_date = excluded.start_date,
          expiry_date = excluded.expiry_date,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          status = excluded.status,
          renewed_at = now();
  end if;

  return req;
end;
$$;

-- Bootstrap default memberships for already-active gym_memberships missing a membership row.
insert into public.memberships (
  gym_id,
  user_id,
  member_id,
  plan_type,
  payment_status,
  start_date,
  expiry_date,
  starts_at,
  ends_at,
  status
)
select
  gm.gym_id,
  gm.user_id,
  gm.user_id,
  'monthly'::public.membership_plan_type,
  'paid'::public.payment_status,
  (gm.joined_at at time zone 'UTC')::date as start_date,
  ((gm.joined_at at time zone 'UTC')::date + 30) as expiry_date,
  (((gm.joined_at at time zone 'UTC')::date)::text || 'T00:00:00Z')::timestamptz as starts_at,
  ((((gm.joined_at at time zone 'UTC')::date + 30)::text) || 'T23:59:59Z')::timestamptz as ends_at,
  case
    when ((gm.joined_at at time zone 'UTC')::date + 30) < ((current_timestamp at time zone 'UTC')::date) then 'expired'::public.membership_status
    when ((gm.joined_at at time zone 'UTC')::date + 30) <= ((current_timestamp at time zone 'UTC')::date + 3) then 'expiring_soon'::public.membership_status
    else 'active'::public.membership_status
  end as status
from public.gym_memberships gm
left join public.memberships m
  on m.gym_id = gm.gym_id
  and m.member_id = gm.user_id
where gm.is_active = true
  and gm.left_at is null
  and m.id is null;
