-- Owner -> Member request flow
-- Adds pending/accept/reject workflow before a user is added to gym_memberships.

do $$ begin
  create type public.gym_member_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.gym_member_requests (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  status public.gym_member_request_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, member_id)
);

create index if not exists idx_gym_member_requests_owner_status on public.gym_member_requests (gym_id, status, created_at desc);
create index if not exists idx_gym_member_requests_member on public.gym_member_requests (member_id, status, created_at desc);

drop trigger if exists trg_gym_member_requests_updated on public.gym_member_requests;
create trigger trg_gym_member_requests_updated before update on public.gym_member_requests
for each row execute function public.set_updated_at();

alter table public.gym_member_requests enable row level security;

drop policy if exists member_requests_owner_select on public.gym_member_requests;
create policy member_requests_owner_select on public.gym_member_requests
  for select using (public.is_gym_owner(gym_id) or member_id = auth.uid());

drop policy if exists member_requests_owner_insert on public.gym_member_requests;
create policy member_requests_owner_insert on public.gym_member_requests
  for insert with check (
    public.is_gym_owner(gym_id)
    and owner_id = auth.uid()
    and member_id <> auth.uid()
  );

drop policy if exists member_requests_owner_update on public.gym_member_requests;
create policy member_requests_owner_update on public.gym_member_requests
  for update using (public.is_gym_owner(gym_id) or member_id = auth.uid())
  with check (public.is_gym_owner(gym_id) or member_id = auth.uid());

create or replace function public.get_owner_member_candidates(
  p_gym_id uuid,
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  profile_id uuid,
  full_name text,
  phone text,
  avatar_url text,
  account_type public.account_type,
  request_status public.gym_member_request_status,
  request_id uuid,
  is_member boolean,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_gym_owner(p_gym_id) then
    raise exception 'Not authorized to fetch candidates';
  end if;

  return query
  with base as (
    select
      p.id as profile_id,
      p.full_name,
      p.phone,
      p.avatar_url,
      p.account_type,
      r.status as request_status,
      r.id as request_id,
      exists (
        select 1
        from public.gym_memberships gm
        where gm.gym_id = p_gym_id
          and gm.user_id = p.id
          and gm.is_active = true
          and gm.left_at is null
      ) as is_member
    from public.profiles p
    left join public.gym_member_requests r
      on r.gym_id = p_gym_id
      and r.member_id = p.id
    where p.id <> auth.uid()
      and (
        p_search is null
        or p_search = ''
        or coalesce(p.full_name, '') ilike '%' || p_search || '%'
        or coalesce(p.phone, '') ilike '%' || p_search || '%'
      )
  )
  select
    base.*,
    count(*) over()::bigint as total_count
  from base
  order by base.is_member asc, base.full_name nulls last, base.phone nulls last
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
  end if;

  return req;
end;
$$;
