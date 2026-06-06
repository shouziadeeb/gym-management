-- Email and OAuth accounts do not require a phone on profiles.
-- Phone remains required only for phone / phone_email_bridge auth types.

alter table public.profiles
  drop constraint if exists profiles_phone_required_for_phone_auth;

alter table public.profiles
  add constraint profiles_phone_required_for_phone_auth check (
    auth_type in ('email', 'oauth')
    or (phone is not null and length(trim(phone)) > 0)
  );

create or replace function public.ensure_profile_phone_on_insert_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_phone text;
  auth_email text;
begin
  if new.auth_type in ('email', 'oauth') then
    return new;
  end if;

  if new.phone is not null and trim(new.phone) <> '' then
    return new;
  end if;

  select
    nullif(trim(au.email), ''),
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
  into auth_email, auth_phone
  from auth.users au
  where au.id = new.id;

  if auth_phone is null then
    raise exception 'Profile phone is required for phone-based accounts and could not be derived from auth.users';
  end if;

  new.phone := auth_phone;
  if new.email is null and auth_email is not null
    and auth_email not like '%@app.local'
    and auth_email not like '%@gymos.app'
  then
    new.email := auth_email;
  end if;

  return new;
end;
$$;
