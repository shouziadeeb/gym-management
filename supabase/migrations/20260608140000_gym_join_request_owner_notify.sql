-- Notify gym owner when a member submits a join/connect request (gym_join_requests).

create or replace function public.notify_owner_gym_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_gym_name text;
  v_requester_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'pending' then
    return new;
  end if;

  select g.owner_id, g.name
  into v_owner_id, v_gym_name
  from public.gyms g
  where g.id = new.gym_id;

  if v_owner_id is null then
    return new;
  end if;

  select p.full_name into v_requester_name
  from public.profiles p
  where p.id = new.user_id;

  perform public.create_notification_record(
    v_owner_id,
    'New join request',
    format(
      '%s requested to join %s.',
      coalesce(nullif(trim(v_requester_name), ''), 'A member'),
      coalesce(nullif(trim(v_gym_name), ''), 'your gym')
    ),
    'owner_join_request',
    'owner',
    new.gym_id,
    'in_app',
    jsonb_build_object(
      'request_id', new.id,
      'gym_id', new.gym_id,
      'user_id', new.user_id
    ),
    format('gym_join_request:%s', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_gym_join_request_owner_notify on public.gym_join_requests;
create trigger trg_gym_join_request_owner_notify
after insert or update of status on public.gym_join_requests
for each row execute function public.notify_owner_gym_join_request();
