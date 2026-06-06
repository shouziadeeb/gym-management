-- Notify the invited member (not the owner) when a gym owner sends a join request.

do $$ begin
  alter type public.app_notification_type add value if not exists 'member_gym_invite';
exception when duplicate_object then null;
end $$;

create or replace function public.notify_member_gym_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_name text;
  v_owner_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  -- Re-notify only when a request becomes pending again (e.g. after rejection).
  if tg_op = 'UPDATE' and old.status = 'pending' then
    return new;
  end if;

  select g.name into v_gym_name from public.gyms g where g.id = new.gym_id;
  select p.full_name into v_owner_name from public.profiles p where p.id = new.owner_id;

  perform public.create_notification_record(
    new.member_id,
    'Gym invitation',
    format(
      '%s has invited you to join %s.',
      coalesce(nullif(trim(v_owner_name), ''), 'A gym owner'),
      coalesce(nullif(trim(v_gym_name), ''), 'their gym')
    ),
    'member_gym_invite',
    'member',
    new.gym_id,
    'in_app',
    jsonb_build_object(
      'request_id', new.id,
      'owner_id', new.owner_id,
      'gym_id', new.gym_id
    ),
    null
  );

  return new;
end;
$$;

drop trigger if exists trg_gym_member_request_notify on public.gym_member_requests;
drop function if exists public.notify_owner_join_request();

create trigger trg_gym_member_request_notify
after insert or update of status on public.gym_member_requests
for each row execute function public.notify_member_gym_invite();
