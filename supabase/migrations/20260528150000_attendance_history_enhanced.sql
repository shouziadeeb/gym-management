-- Enhanced attendance history: server-side search, sort, indexes.

create index if not exists idx_attendance_gym_date
  on public.attendance (gym_id, attendance_date desc);

create index if not exists idx_attendance_gym_member
  on public.attendance (gym_id, member_id);

create index if not exists idx_attendance_gym_created
  on public.attendance (gym_id, created_at desc);

drop function if exists public.get_gym_attendance_history(uuid, date, date, uuid, integer, integer);

create or replace function public.get_gym_attendance_history(
  p_gym_id uuid,
  p_from date default null,
  p_to date default null,
  p_member_id uuid default null,
  p_search text default null,
  p_sort text default 'newest',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  member_id uuid,
  member_name text,
  member_phone text,
  avatar_url text,
  membership_status text,
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
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_gym_owner(p_gym_id) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with filtered as (
    select
      a.*,
      p.full_name,
      p.phone,
      p.avatar_url,
      coalesce(m.status::text, 'active') as membership_status
    from public.attendance a
    join public.profiles p on p.id = a.member_id
    left join public.memberships m
      on m.gym_id = a.gym_id
     and m.user_id = a.member_id
    where a.gym_id = p_gym_id
      and (p_from is null or a.attendance_date >= p_from)
      and (p_to is null or a.attendance_date <= p_to)
      and (p_member_id is null or a.member_id = p_member_id)
      and (
        v_search is null
        or p.full_name ilike '%' || v_search || '%'
        or p.phone ilike '%' || v_search || '%'
      )
  ),
  counted as (
    select count(*)::bigint as total from filtered
  )
  select
    f.id,
    f.member_id,
    f.full_name,
    f.phone,
    f.avatar_url,
    f.membership_status,
    f.attendance_date,
    f.attendance_time,
    f.scanned_token,
    f.created_at,
    c.total
  from filtered f
  cross join counted c
  order by
    case when coalesce(p_sort, 'newest') = 'oldest' then f.attendance_date end asc,
    case when coalesce(p_sort, 'newest') = 'oldest' then f.attendance_time end asc,
    case when p_sort = 'name_asc' then lower(coalesce(f.full_name, '')) end asc,
    case when p_sort = 'checkin_latest' then f.attendance_time end desc,
    case when coalesce(p_sort, 'newest') in ('newest', 'checkin_latest') then f.attendance_date end desc nulls last,
    case when coalesce(p_sort, 'newest') in ('newest', 'checkin_latest') then f.attendance_time end desc nulls last
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function public.get_gym_attendance_history(uuid, date, date, uuid, text, text, integer, integer) to authenticated;
grant execute on function public.get_gym_attendance_history(uuid, date, date, uuid, text, text, integer, integer) to service_role;

notify pgrst, 'reload schema';
