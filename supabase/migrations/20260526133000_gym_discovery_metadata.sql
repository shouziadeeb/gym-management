-- Discovery & marketplace readiness: geographic, social proof, taxonomy, ranking signals.
-- Safe additive migration with defaults — existing gyms remain readable without seeding.

alter table public.gyms
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists rating_avg numeric(4,2) not null default 0
    constraint chk_gyms_rating_avg_range check (rating_avg >= 0 and rating_avg <= 5),
  add column if not exists review_count integer not null default 0
    constraint chk_gyms_review_count_nonneg check (review_count >= 0),
  add column if not exists active_member_count integer not null default 0
    constraint chk_gyms_active_member_count_nonneg check (active_member_count >= 0),
  add column if not exists popularity_score numeric(14,4) not null default 0,
  add column if not exists trending_score numeric(14,4) not null default 0,
  add column if not exists categories text[] not null default '{}',
  add column if not exists is_active boolean not null default true;

comment on column public.gyms.latitude is 'Approximate centroid latitude for member-facing discovery (EPSG:4326).';
comment on column public.gyms.longitude is 'Approximate centroid longitude for member-facing discovery (EPSG:4326).';
comment on column public.gyms.rating_avg is 'Aggregate star rating average (0-5); maintain via nightly job / triggers.';
comment on column public.gyms.review_count is 'Number of published reviews powering rating_avg.';
comment on column public.gyms.active_member_count is 'Rolling count of active memberships for popularity signals.';
comment on column public.gyms.popularity_score is 'Deterministic composite popularity rank; refresh via cron or materialized pipeline.';
comment on column public.gyms.trending_score is 'Deterministic trending rank; optionally blend recency / engagement deltas.';
comment on column public.gyms.categories is 'Human-readable taxonomy slugs surfaced in Explore filters.';
comment on column public.gyms.is_active is 'Soft-toggle for gyms that should not surface in marketplace discovery surfaces.';

create index if not exists idx_gyms_discovery_popularity_desc on public.gyms (popularity_score desc nulls last);
create index if not exists idx_gyms_discovery_rating_desc on public.gyms (rating_avg desc nulls last);
create index if not exists idx_gyms_discovery_trending_desc on public.gyms (trending_score desc nulls last);
create index if not exists idx_gyms_discovery_created_desc on public.gyms (created_at desc);
create index if not exists idx_gyms_discovery_categories on public.gyms using gin (categories);
create index if not exists idx_gyms_discovery_geo_partial on public.gyms (latitude, longitude)
  where latitude is not null and longitude is not null;
