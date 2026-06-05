-- Gym follow system: gym_followers table, follower_count, active_member_count maintenance, realtime.

alter table public.gyms
  add column if not exists follower_count integer not null default 0
    constraint chk_gyms_follower_count_nonneg check (follower_count >= 0);

comment on column public.gyms.follower_count is 'Denormalized count of gym_followers rows; maintained by trigger.';

create table if not exists public.gym_followers (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_gym_followers_gym_user unique (gym_id, user_id)
);

create index if not exists idx_gym_followers_gym on public.gym_followers (gym_id);
create index if not exists idx_gym_followers_user on public.gym_followers (user_id, created_at desc);

alter table public.gym_followers enable row level security;

drop policy if exists gym_followers_select_own on public.gym_followers;
create policy gym_followers_select_own on public.gym_followers
  for select using (user_id = auth.uid());

drop policy if exists gym_followers_insert_own on public.gym_followers;
create policy gym_followers_insert_own on public.gym_followers
  for insert with check (user_id = auth.uid());

drop policy if exists gym_followers_delete_own on public.gym_followers;
create policy gym_followers_delete_own on public.gym_followers
  for delete using (user_id = auth.uid());

create or replace function public.bump_gym_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.gyms
    set follower_count = follower_count + 1
    where id = NEW.gym_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.gyms
    set follower_count = greatest(0, follower_count - 1)
    where id = OLD.gym_id;
    return OLD;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_gym_followers_count on public.gym_followers;
create trigger trg_gym_followers_count
after insert or delete on public.gym_followers
for each row execute function public.bump_gym_follower_count();

create or replace function public.refresh_gym_active_member_count(p_gym_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)::integer
  into v_count
  from public.gym_memberships gm
  inner join public.memberships m
    on m.gym_id = gm.gym_id
    and m.member_id = gm.user_id
  where gm.gym_id = p_gym_id
    and gm.is_active = true
    and gm.left_at is null
    and m.status = 'active';

  update public.gyms
  set active_member_count = coalesce(v_count, 0)
  where id = p_gym_id;
end;
$$;

create or replace function public.trg_refresh_gym_active_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
begin
  v_gym_id := coalesce(NEW.gym_id, OLD.gym_id);
  perform public.refresh_gym_active_member_count(v_gym_id);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_gym_memberships_active_count on public.gym_memberships;
create trigger trg_gym_memberships_active_count
after insert or update of is_active, left_at or delete on public.gym_memberships
for each row execute function public.trg_refresh_gym_active_member_count();

create or replace function public.trg_refresh_gym_active_member_count_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
begin
  v_gym_id := coalesce(NEW.gym_id, OLD.gym_id);
  perform public.refresh_gym_active_member_count(v_gym_id);
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_memberships_active_count on public.memberships;
create trigger trg_memberships_active_count
after insert or update of status or delete on public.memberships
for each row execute function public.trg_refresh_gym_active_member_count_from_membership();

update public.gyms g
set follower_count = coalesce((
  select count(*)::integer from public.gym_followers gf where gf.gym_id = g.id
), 0);

do $$
declare
  gym_row record;
begin
  for gym_row in select id from public.gyms loop
    perform public.refresh_gym_active_member_count(gym_row.id);
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.gyms;
  end if;
exception
  when duplicate_object then null;
end;
$$;
