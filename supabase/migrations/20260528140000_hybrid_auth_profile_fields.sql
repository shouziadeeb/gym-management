-- Hybrid auth: extend profiles for email + phone auth without breaking existing users.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE patterns.

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.auth_method as enum ('phone', 'email', 'oauth');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.auth_provider as enum (
    'phone',
    'phone_email_bridge',
    'email',
    'google',
    'apple',
    'whatsapp'
  );
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Profile columns
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text,
  add column if not exists auth_provider public.auth_provider not null default 'phone',
  add column if not exists auth_type public.auth_method not null default 'phone',
  add column if not exists email_verified boolean not null default false,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_profiles_email on public.profiles (lower(email))
  where email is not null;

-- -----------------------------------------------------------------------------
-- Backfill from auth.users (non-destructive)
-- -----------------------------------------------------------------------------
with auth_snapshot as (
  select
    au.id,
    nullif(trim(au.email), '') as auth_email,
    nullif(trim(au.phone), '') as auth_phone,
    coalesce(au.email_confirmed_at is not null, false) as email_confirmed,
    coalesce(au.phone_confirmed_at is not null, false) as phone_confirmed,
    au.raw_user_meta_data
  from auth.users au
),
derived as (
  select
    s.id,
    s.auth_email,
    s.auth_phone,
    s.email_confirmed,
    s.phone_confirmed,
    case
      when s.auth_email like '%@gymos.app' or s.auth_email like '%@app.local' then 'phone_email_bridge'::public.auth_provider
      when s.auth_phone is not null then 'phone'::public.auth_provider
      when s.auth_email is not null then 'email'::public.auth_provider
      else 'phone'::public.auth_provider
    end as auth_provider,
    case
      when s.auth_email like '%@gymos.app' or s.auth_email like '%@app.local' then 'phone'::public.auth_method
      when s.auth_phone is not null and s.auth_email is null then 'phone'::public.auth_method
      when s.auth_email is not null and s.auth_phone is null then 'email'::public.auth_method
      when s.auth_phone is not null then 'phone'::public.auth_method
      else 'phone'::public.auth_method
    end as auth_type,
    case
      when s.auth_email like '%@gymos.app' or s.auth_email like '%@app.local' then null
      else s.auth_email
    end as profile_email,
    coalesce(
      s.auth_phone,
      nullif(trim(s.raw_user_meta_data->>'phone'), ''),
      case
        when s.auth_email like '%@app.local' then '+' || split_part(s.auth_email, '@', 1)
        when s.auth_email like '%@gymos.app' then '+' || split_part(s.auth_email, '@', 1)
        else null
      end
    ) as profile_phone
  from auth_snapshot s
)
update public.profiles p
set
  email = coalesce(p.email, d.profile_email),
  phone = coalesce(nullif(trim(p.phone), ''), d.profile_phone),
  auth_provider = d.auth_provider,
  auth_type = d.auth_type,
  email_verified = coalesce(p.email_verified, false) or d.email_confirmed,
  phone_verified = coalesce(p.phone_verified, false) or d.phone_confirmed,
  provider_metadata = coalesce(p.provider_metadata, '{}'::jsonb)
    || jsonb_strip_nulls(
      jsonb_build_object(
        'migrated_at', now(),
        'auth_email', d.auth_email,
        'bridge_domain',
          case
            when d.auth_email like '%@gymos.app' then 'gymos.app'
            when d.auth_email like '%@app.local' then 'app.local'
            else null
          end
      )
    )
from derived d
where p.id = d.id;

-- -----------------------------------------------------------------------------
-- Phone constraint: required for phone auth; optional for email auth
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_phone_not_blank;

alter table public.profiles
  add constraint profiles_phone_required_for_phone_auth check (
    auth_type = 'email'
    or (phone is not null and length(trim(phone)) > 0)
  );

-- -----------------------------------------------------------------------------
-- Trigger: derive phone from auth when possible; skip for email-only users
-- -----------------------------------------------------------------------------
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
  if new.auth_type = 'email' then
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

-- -----------------------------------------------------------------------------
-- New user -> profile (hybrid-aware)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_provider public.auth_provider;
  v_auth_type public.auth_method;
  v_phone text;
  v_email text;
  v_is_bridge boolean;
begin
  v_is_bridge := new.email like '%@gymos.app' or new.email like '%@app.local';

  v_phone := coalesce(
    nullif(trim(new.phone), ''),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    case
      when v_is_bridge then '+' || split_part(new.email, '@', 1)
      else null
    end
  );

  v_email := case
    when v_is_bridge then null
    else nullif(trim(new.email), '')
  end;

  if v_is_bridge or v_phone is not null then
    v_auth_provider := case
      when v_is_bridge then 'phone_email_bridge'::public.auth_provider
      else 'phone'::public.auth_provider
    end;
    v_auth_type := 'phone'::public.auth_method;
  elsif v_email is not null then
    v_auth_provider := 'email'::public.auth_provider;
    v_auth_type := 'email'::public.auth_method;
  else
    v_auth_provider := 'phone'::public.auth_provider;
    v_auth_type := 'phone'::public.auth_method;
  end if;

  insert into public.profiles (
    id,
    phone,
    full_name,
    email,
    auth_provider,
    auth_type,
    email_verified,
    phone_verified,
    provider_metadata
  )
  values (
    new.id,
    v_phone,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_email,
    v_auth_provider,
    v_auth_type,
    coalesce(new.email_confirmed_at is not null, false),
    coalesce(new.phone_confirmed_at is not null, false),
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
