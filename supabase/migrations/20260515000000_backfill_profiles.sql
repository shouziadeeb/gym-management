-- Backfill profiles for auth users created before handle_new_user trigger existed.
-- No-op on databases that already have profiles (avoids phone unique conflicts).

do $migration$
begin
  if exists (select 1 from public.profiles limit 1) then
    raise notice 'backfill_profiles: skipped — profiles already exist';
    return;
  end if;

  insert into public.profiles (id, phone, full_name, role)
  select
    candidate.id,
    candidate.phone,
    candidate.full_name,
    candidate.role
  from (
    select
      u.id,
      u.phone,
      coalesce(u.raw_user_meta_data->>'full_name', '') as full_name,
      'member'::public.user_role as role,
      row_number() over (
        partition by case
          when u.phone is null or trim(u.phone) = '' then u.id::text
          else u.phone
        end
        order by u.created_at
      ) as row_num
    from auth.users u
    where not exists (
      select 1 from public.profiles p where p.id = u.id
    )
    and (
      u.phone is null
      or trim(u.phone) = ''
      or not exists (
        select 1
        from public.profiles p2
        where p2.phone = u.phone
      )
    )
  ) as candidate
  where candidate.row_num = 1
  on conflict (id) do nothing;
end $migration$;
