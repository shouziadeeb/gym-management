-- Profile setup fields for post-auth onboarding.
-- Keeps phone-first auth while collecting richer profile details.

alter table public.profiles
  add column if not exists gender text,
  add column if not exists age integer,
  add column if not exists date_of_birth date,
  add column if not exists fitness_goal text,
  add column if not exists city text,
  add column if not exists onboarding_completed boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender in ('male', 'female', 'other', 'prefer_not_to_say') or gender is null);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_age_check'
  ) then
    alter table public.profiles
      add constraint profiles_age_check
      check (age is null or (age >= 13 and age <= 100));
  end if;
end $$;

