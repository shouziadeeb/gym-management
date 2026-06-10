-- Notify gym owner when a user follows their gym.

do $$ begin
  alter type public.app_notification_type add value if not exists 'owner_new_follower';
exception when duplicate_object then null;
end $$;

create or replace function public.notify_owner_gym_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_gym_name text;
  v_follower_name text;
begin
  select g.owner_id, g.name
  into v_owner_id, v_gym_name
  from public.gyms g
  where g.id = new.gym_id;

  if v_owner_id is null or v_owner_id = new.user_id then
    return new;
  end if;

  select p.full_name into v_follower_name
  from public.profiles p
  where p.id = new.user_id;

  perform public.create_notification_record(
    v_owner_id,
    'New follower',
    format(
      '%s started following %s.',
      coalesce(nullif(trim(v_follower_name), ''), 'Someone'),
      coalesce(nullif(trim(v_gym_name), ''), 'your gym')
    ),
    'owner_new_follower',
    'owner',
    new.gym_id,
    'in_app',
    jsonb_build_object(
      'gym_id', new.gym_id,
      'follower_id', new.user_id
    ),
    format('gym_follow:%s:%s', new.gym_id, new.user_id)
  );

  return new;
end;
$$;

drop trigger if exists trg_gym_follower_owner_notify on public.gym_followers;
create trigger trg_gym_follower_owner_notify
after insert on public.gym_followers
for each row execute function public.notify_owner_gym_follower();
