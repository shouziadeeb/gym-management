-- Notify the member when an owner approves or rejects their gym join request.

do $$ begin
  alter type public.app_notification_type add value if not exists 'member_join_approved';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.app_notification_type add value if not exists 'member_join_rejected';
exception when duplicate_object then null;
end $$;

create or replace function public.notify_member_join_request_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_name text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status <> 'pending' then
    return new;
  end if;

  select g.name into v_gym_name from public.gyms g where g.id = new.gym_id;

  if new.status = 'approved' then
    perform public.create_notification_record(
      new.user_id,
      'Join request approved',
      format(
        'Welcome! You are now a member of %s.',
        coalesce(nullif(trim(v_gym_name), ''), 'the gym')
      ),
      'member_join_approved',
      'member',
      new.gym_id,
      'in_app',
      jsonb_build_object(
        'request_id', new.id,
        'gym_id', new.gym_id
      ),
      format('member_join_approved:%s', new.id)
    );
  elsif new.status = 'rejected' then
    perform public.create_notification_record(
      new.user_id,
      'Join request declined',
      format(
        'Your request to join %s was not approved.',
        coalesce(nullif(trim(v_gym_name), ''), 'the gym')
      ),
      'member_join_rejected',
      'member',
      new.gym_id,
      'in_app',
      jsonb_build_object(
        'request_id', new.id,
        'gym_id', new.gym_id
      ),
      format('member_join_rejected:%s', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_gym_join_request_member_response_notify on public.gym_join_requests;
create trigger trg_gym_join_request_member_response_notify
after update of status on public.gym_join_requests
for each row execute function public.notify_member_join_request_response();
