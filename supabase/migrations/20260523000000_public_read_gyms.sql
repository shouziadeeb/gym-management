-- Allow public/anonymous users to browse gyms for discovery pages.
-- This keeps owner/member write controls intact while enabling marketplace-style listing.

drop policy if exists gyms_select_public on public.gyms;
create policy gyms_select_public on public.gyms
  for select
  to anon, authenticated
  using (true);

