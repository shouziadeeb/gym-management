import type { AttendanceHistoryFilters, AttendanceHistorySort, OwnerAttendanceRow } from '@/features/attendance/types';

function normalizeSearch(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function filterAttendanceRowsBySearch(rows: OwnerAttendanceRow[], search?: string): OwnerAttendanceRow[] {
  const query = normalizeSearch(search);
  if (!query) return rows;

  return rows.filter((row) => {
    const name = row.member_name?.toLowerCase() ?? '';
    const phone = row.member_phone?.toLowerCase() ?? '';
    return name.includes(query) || phone.includes(query);
  });
}

export function sortAttendanceRows(rows: OwnerAttendanceRow[], sort: AttendanceHistorySort = 'newest'): OwnerAttendanceRow[] {
  const copy = [...rows];

  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => {
        const date = a.attendance_date.localeCompare(b.attendance_date);
        if (date !== 0) return date;
        return a.attendance_time.localeCompare(b.attendance_time);
      });
    case 'name_asc':
      return copy.sort((a, b) => (a.member_name ?? '').localeCompare(b.member_name ?? ''));
    case 'checkin_latest':
      return copy.sort((a, b) => b.attendance_time.localeCompare(a.attendance_time));
    case 'newest':
    default:
      return copy.sort((a, b) => {
        const date = b.attendance_date.localeCompare(a.attendance_date);
        if (date !== 0) return date;
        return b.attendance_time.localeCompare(a.attendance_time);
      });
  }
}

export function applyClientAttendanceHistoryFilters(
  rows: OwnerAttendanceRow[],
  filters: Pick<AttendanceHistoryFilters, 'search' | 'sort'>,
): OwnerAttendanceRow[] {
  return sortAttendanceRows(filterAttendanceRowsBySearch(rows, filters.search), filters.sort ?? 'newest');
}
