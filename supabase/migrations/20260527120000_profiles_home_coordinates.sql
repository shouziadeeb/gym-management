-- Optional home-area coordinates captured during onboarding for recommendations when foreground GPS is off.

alter table public.profiles
  add column if not exists home_latitude double precision,
  add column if not exists home_longitude double precision,
  add column if not exists home_location_label text;

comment on column public.profiles.home_latitude is 'Approximate member home latitude (EPSG:4326); from onboarding/device.';
comment on column public.profiles.home_longitude is 'Approximate member home longitude (EPSG:4326); from onboarding/device.';
comment on column public.profiles.home_location_label is 'Reverse-geocoded or user-facing label for home location preview.';
