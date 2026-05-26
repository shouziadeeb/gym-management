# Attendance (QR check-in)

Production-ready QR attendance module for gym owners and members.

## Folder structure

```
src/features/attendance/
  constants.ts          # QR version, page size, token prefix
  types.ts              # Shared attendance types
  domain/
    qr-payload.ts       # Secure QR encode/decode (no gym IDs)
    validate-scan.ts    # Client scan validation + RPC result normalization
    format.ts           # Date/time formatters
  hooks/
    useOwnerAttendance.ts
    useAttendanceScanner.ts
  components/
    AttendanceQrCode.tsx
    AttendanceScanner.tsx
    AttendanceStatusCard.tsx
    AttendanceHistoryList.tsx
    AttendanceStatsCard.tsx
src/api/attendance.api.ts
src/screens/owner/OwnerAttendanceScreen.tsx
src/screens/member/MemberAttendanceScannerScreen.tsx
src/screens/member/MemberAttendanceHistoryScreen.tsx
app/attendance.tsx
app/attendance-scan.tsx
app/attendance-history.tsx
supabase/migrations/20260528120000_attendance_qr_system.sql
```

## Database

**`gyms`**
- `attendance_token` — secure random token (`gat_<48 hex>`), unique
- `attendance_enabled` — owner toggle
- `qr_generated_at` — last generation timestamp

**`attendance`**
- `gym_id`, `member_id` / `user_id`
- `scanned_token`, `attendance_date`, `attendance_time`, `created_at`
- Unique index: `(gym_id, user_id, attendance_date)` — one check-in per day

## Security

- QR payload is JSON `{ v: 1, t: "<token>" }` — never exposes gym UUIDs
- Tokens generated server-side via `generate_attendance_token()` (`gen_random_bytes`)
- Check-in uses `mark_attendance_by_token()` (security definer) with full validation
- Direct client inserts to `attendance` are blocked by RLS (`insert with check (false)`)
- Owners: `is_gym_owner()` on all owner RPCs
- Members: `get_member_attendance_history()` scoped to `auth.uid()`

## RPCs

| RPC | Role | Purpose |
|-----|------|---------|
| `owner_upsert_attendance_qr` | Owner | Generate / regenerate QR token |
| `owner_set_attendance_enabled` | Owner | Enable / disable scanning |
| `owner_delete_attendance_qr` | Owner | Delete token + disable |
| `mark_attendance_by_token` | Member | Validate + record attendance |
| `get_gym_today_attendance` | Owner | Today's check-ins |
| `get_gym_attendance_history` | Owner | Paginated history + filters |
| `get_member_attendance_history` | Member | Own history |
| `owner_delete_attendance_record` | Owner | Delete a record |

## Validation (server-side)

1. Token exists and maps to a gym
2. Gym is active and attendance enabled
3. Member has active `gym_memberships` link
4. Billing `memberships.status` is `active` or `expiring_soon`
5. No existing row for `(gym_id, user_id, attendance_date)` in gym timezone

## Future-ready hooks

Architecture supports adding without breaking APIs:

- Analytics dashboards → extend `get_gym_attendance_history` aggregations
- Streaks → domain module over attendance rows
- GPS radius → validate inside `mark_attendance_by_token`
- Selfie / kiosk → new `source` values + optional metadata column

## Apply migration

If QR generate returns **404**, the table columns may exist but RPC functions were not created (migration stopped mid-file).

1. Run `supabase/migrations/20260528130000_attendance_qr_repair.sql` in Supabase SQL Editor
2. Confirm one row returns:
   ```sql
   select proname, pg_get_function_identity_arguments(oid)
   from pg_proc
   where proname = 'owner_upsert_attendance_qr';
   ```
3. Reload the app and try again

For fresh installs, run both migrations in order.

## Routes

- `/attendance` — owner dashboard (QR + today + history)
- `/attendance-scan` — member scanner
- `/attendance-history` — member history
