# Owner Member Management (Phase 7C)

This module layer supports secure and scalable owner-member fetching.

## Database design additions

- `profiles.account_type` (`normal_user`, `gym_owner`) for account-class guards
- RPC: `promote_user_to_gym_owner(p_user_id)` for gym-creation role upgrade
- RPC: `get_owner_gym_members(...)` for owner-only paginated member search
- RPC: `get_owner_gym_member_summary(p_gym_id)` for dashboard counters

## Service APIs

- `fetchOwnerGymMembers({ gymId, search, status, page, pageSize })`
- `fetchOwnerGymMemberSummary(gymId)`

## Hooks

- `useMemberSearch()` debounce + filter + pagination state
- `useMembers()` owner-member query layer
- `useOwnerDashboard()` composed dashboard data
- `useRequireOwner()` route-level role guard

## Components

- `OwnerMemberFilters` search + status chips
- `OwnerMemberProfileCard` reusable member card
- `OwnerDashboardStats` owner summary
- `OwnerMemberListSkeleton` loading state

## Security model

- Member data is fetched through security-definer RPCs that validate ownership using `is_gym_owner(gym_id)`.
- Non-owner users cannot access owner routes (`dashboard`, `manage-members`, `membership-lifecycle`) due to `useRequireOwner`.
- Existing RLS still protects table-level direct access.

## Scalability

- Pagination via `limit` + `offset`
- Server-side search and status filters
- Shared hooks/components to expand toward trainer/staff/multi-gym views
