-- Backfill profiles for auth users created before handle_new_user trigger existed.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

insert into public.profiles (id, phone, full_name, role)
select
  u.id,
  u.phone,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'member'::public.user_role
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;
