-- Server-side push dispatch for notifications created while the app is backgrounded.
-- Requires pg_net (enabled on hosted Supabase). Skips gracefully when settings are unset.

create extension if not exists pg_net with schema extensions;

create table if not exists public.notification_push_settings (
  id smallint primary key default 1 check (id = 1),
  functions_base_url text not null,
  cron_secret text not null,
  updated_at timestamptz not null default now()
);

comment on table public.notification_push_settings is
  'One-time project config for DB→Edge push dispatch. Insert via SQL editor after deploy.';

alter table public.notification_push_settings enable row level security;

drop policy if exists notification_push_settings_service on public.notification_push_settings;
-- No policies: only service role / postgres can read; clients cannot access secrets.

create or replace function public.trigger_notification_push_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_url text;
  v_secret text;
  v_request_id bigint;
begin
  if NEW.sent_at is not null then
    return NEW;
  end if;

  select functions_base_url, cron_secret
  into v_base_url, v_secret
  from public.notification_push_settings
  where id = 1;

  if v_base_url is null or v_secret is null or length(trim(v_base_url)) = 0 then
    return NEW;
  end if;

  select net.http_post(
    url := rtrim(v_base_url, '/') || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := jsonb_build_object('notificationId', NEW.id)
  )
  into v_request_id;

  return NEW;
exception
  when others then
    -- Never block notification inserts if dispatch fails.
    return NEW;
end;
$$;

drop trigger if exists trg_notifications_push_dispatch on public.notifications;
create trigger trg_notifications_push_dispatch
after insert on public.notifications
for each row execute function public.trigger_notification_push_dispatch();
