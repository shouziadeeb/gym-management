-- Ensure phone is always present in profiles.
-- Backfill from auth.users before enforcing non-null + not-empty constraints.

with normalized_phone as (
  select
    au.id,
    nullif(
      trim(
        coalesce(
          au.phone,
          au.raw_user_meta_data->>'phone',
          case
            when au.email like '%@app.local' then '+' || split_part(au.email, '@', 1)
            when au.email like '%@gymos.app' then '+' || split_part(au.email, '@', 1)
            else null
          end
        )
      ),
      ''
    ) as phone
  from auth.users au
),
safe_candidates as (
  select
    np.id,
    np.phone,
    row_number() over (
      partition by np.phone
      order by p.created_at asc, p.id asc
    ) as phone_rank
  from normalized_phone np
  join public.profiles p on p.id = np.id
  where np.phone is not null
    and not exists (
      select 1
      from public.profiles p2
      where p2.phone = np.phone
        and p2.id <> np.id
    )
),
deduped_candidates as (
  select id, phone
  from safe_candidates
  where phone_rank = 1
)
update public.profiles p
set phone = dc.phone
from deduped_candidates dc
where p.id = dc.id
  and (p.phone is null or trim(p.phone) = '');

do $$
declare
  unresolved_count integer;
begin
  select count(*)
  into unresolved_count
  from public.profiles p
  where p.phone is null or trim(p.phone) = '';

  if unresolved_count > 0 then
    raise notice 'profiles.phone unresolved for % rows due missing/duplicate auth phone values. New writes are still enforced by trigger.', unresolved_count;
  end if;
end $$;

create or replace function public.ensure_profile_phone_on_insert_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_phone text;
begin
  if new.phone is not null and trim(new.phone) <> '' then
    return new;
  end if;

  select
    nullif(
      trim(
        coalesce(
          au.phone,
          au.raw_user_meta_data->>'phone',
          case
            when au.email like '%@app.local' then '+' || split_part(au.email, '@', 1)
            when au.email like '%@gymos.app' then '+' || split_part(au.email, '@', 1)
            else null
          end
        )
      ),
      ''
    )
  into auth_phone
  from auth.users au
  where au.id = new.id;

  if auth_phone is null then
    raise exception 'Profile phone is required and could not be derived from auth.users';
  end if;

  new.phone := auth_phone;
  return new;
end;
$$;

drop trigger if exists trg_profiles_phone_required on public.profiles;
create trigger trg_profiles_phone_required
before insert or update of phone on public.profiles
for each row execute function public.ensure_profile_phone_on_insert_update();

alter table public.profiles
  drop constraint if exists profiles_phone_not_blank;

alter table public.profiles
  add constraint profiles_phone_not_blank check (length(trim(phone)) > 0);
