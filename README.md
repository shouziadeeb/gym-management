# GYM — Gym management (Expo + Supabase)

## Architecture

The app uses a scalable modular structure:

- `src/api/` typed Supabase query modules (`*.api.ts`)
- `src/services/auth/` authentication orchestration (`auth.service.ts`)
- `src/lib/` infrastructure utilities (env, logger, retry, supabase)
- `src/store/` Zustand state (`auth.store.ts`, `app.store.ts`)
- `src/hooks/` feature hooks (`useAuthSession`, `useUserGyms`, `useRegisterPush`)
- `src/navigation/` root navigation + `navigation/stacks` for member/owner stacks
- `src/screens/` role-based UI screens
- `src/components/` reusable UI and domain widgets
- `src/constants/`, `src/utils/`, `src/types/` for shared foundations

Compatibility re-export files are kept under `src/services/api/` and `src/stores/` so existing imports continue to work while migrating.

## Prerequisites

- Node 18+
- Supabase project with SQL migration applied: `supabase/migrations/20260514000000_init_gym_saas.sql`
- Phone auth enabled in Supabase (Auth ? Providers ? Phone)

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

3. If users signed up before migration, run one-time backfill:

   - `supabase/migrations/20260515000000_backfill_profiles.sql`

4. Install and start:

   ```bash
   npm install
   npm start
   ```

## Current foundations implemented

- OTP auth service with E.164 normalization
- AsyncStorage-backed Supabase auth persistence
- Query key centralization for safer cache invalidation
- Structured logger utility
- Retry helper
- Typed error mapping for Supabase/Auth errors
- Multi-gym context in centralized Zustand store

## Next recommended milestones

- Add generated Supabase `Database` types and strongly type API responses
- Add edge-function powered push reminder jobs
- Add role-aware middleware helpers for owner/member route guards
- Add integration tests for auth + onboarding + gym creation flows
- Add payment provider integration module (Stripe) behind interface