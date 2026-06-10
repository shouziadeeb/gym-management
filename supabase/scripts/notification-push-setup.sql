-- Run once in the Supabase SQL editor after deploying edge functions.
-- Replace placeholders with your project values.
--
-- 1. Deploy functions: send-push, flush-user-push
-- 2. Set Edge Function secret CRON_SECRET (Dashboard → Edge Functions → Secrets)
-- 3. Run this script with the same CRON_SECRET and your project URL

insert into public.notification_push_settings (id, functions_base_url, cron_secret)
values (
  1,
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_CRON_SECRET'
)
on conflict (id) do update
set functions_base_url = excluded.functions_base_url,
    cron_secret = excluded.cron_secret,
    updated_at = now();
