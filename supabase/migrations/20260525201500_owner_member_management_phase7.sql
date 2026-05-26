-- Phase 7B: Gym owner member management, account type roles, and secure owner-member fetching.

do $$ begin
  create type public.account_type as enum ('normal_user', 'gym_owner');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists account_type public.account_type not null default 'normal_user';

create index if not exists idx_profiles_account_type on public.profiles (account_type);

update public.profiles
set account_type = case when role = 'owner' then 'gym_owner'::public.account_type else 'normal_user'::public.account_type end
where account_type is null;

create or replace function public.promote_user_to_gym_owner(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'owner',
      account_type = 'gym_owner'
  where id = p_user_id;
end;
$$;

create or replace function public.get_owner_gym_member_summary(p_gym_id uuid)
returns table (
  total_members bigint,
  active_memberships bigint,
  expiring_memberships bigint,
  expired_memberships bigint
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
    select m.status
    from public.gym_memberships gm
    left join public.memberships m
      on m.gym_id = gm.gym_id
      and m.member_id = gm.user_id
    where gm.gym_id = p_gym_id
      and gm.is_active = true
      and gm.left_at is null
  )
  select
    count(*)::bigint as total_members,
    count(*) filter (where status = 'active')::bigint as active_memberships,
    count(*) filter (where status = 'expiring_soon')::bigint as expiring_memberships,
    count(*) filter (where status = 'expired')::bigint as expired_memberships
  from base;
end;
$$;

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
      m.status as membership_status,
      m.payment_status,
      m.plan_type,
      m.expiry_date,
      case
        when m.expiry_date is null then null
        else (m.expiry_date - ((current_timestamp at time zone 'UTC')::date))::integer
      end as remaining_days
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
        or m.status = p_status
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
