# Gym discovery architecture

Routes split marketplace **inspiration** (Home tab) vs **utility search** (Explore tab). Hooks, Supabase accessors, and domain logic remain isolated so swapping in richer ranking APIs (Geo RPC, personalization models) does not regress UI seams.

```
src/domain/discovery/        Pure ranking, distance, personalization scoring, rails
src/api/gyms-discovery.api.ts Server-side paging + taxonomy filters
src/hooks/useHomeDiscovery.ts Feeds personalised dashboard rails
src/hooks/useExploreMarketplace.ts Infinite list + blended client filters + geo batch modes
src/hooks/useUserCoordinates.ts expo-location façade (permission-aware)
src/services/discovery/preferences.storage.ts Behavioural breadcrumbs (recently viewed, searches, fave categories)
src/components/discovery/*    Presentational primitives (cards, promos, filters)
supabase/migrations/*gym_discovery_metadata.sql Schema for geo + ratings + categories + popularity indexes
```

## Next scaling steps

- Promote geo ordering to Supabase RPC using PostGIS or `cube`/`earthdistance` once row counts explode.
- Materialize nightly `popularity_score` / `trending_score` using warehouse jobs instead of heuristic fallbacks.
- Split read models (`gym_discovery_view`) exposing only columns the client needs plus JSON excerpts.
- Extend `RecommendationContext` ingestion with vector search / embeddings while keeping deterministic fallbacks offline-safe.
