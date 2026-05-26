# Membership Lifecycle (Phase 7)

This module centralizes membership business rules and keeps UI thin.

## Folder structure

- `src/domain/memberships/types.ts` - domain types and constants
- `src/domain/memberships/config.ts` - durations, filter/sort options
- `src/domain/memberships/date.ts` - canonical date/status logic
- `src/domain/memberships/presentation.ts` - label/tone/countdown mappers

## Core reusable functions

- `calculateExpiryDate(startDate, planType)`
- `getMembershipStatus(expiryDate)`
- `getRemainingDays(expiryDate)`
- `isMembershipExpired(expiryDate)`

## Supabase integration

- `src/api/membership-lifecycle.api.ts` handles CRUD + renewals + status refresh
- migration `20260525194000_membership_lifecycle_phase7.sql` adds:
  - `plan_type`, `payment_status`, `start_date`, `expiry_date`
  - `membership_renewals` (history)
  - `membership_notification_events` (notification pipeline prep)
  - indexed status/expiry columns

## UI layer

- `MembershipStatusBadge` for color-coded statuses
- `MembershipCountdown` for days left / expired text
- `MembershipDashboardFilters` for filter/sort controls
- `MembershipSummaryCards` for active/expiring/expired overview

## Hooks

- `useMembershipStatus` - derived status/countdown for one membership
- `useMembershipClock` - lightweight interval clock (countdown refresh)
- `useMembershipDashboard` - query + summary + filter/sort state

## Scaling guidance

- Use pagination in `fetchGymMemberships` (`range`) once row count grows
- Refresh statuses in background via scheduled `refresh_membership_statuses()`
- Drive reminders from `membership_notification_events` queue consumers
- Keep renewals append-only (`membership_renewals`) for analytics and auditing
