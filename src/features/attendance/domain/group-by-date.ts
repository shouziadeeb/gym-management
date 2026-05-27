import { format, parseISO } from 'date-fns';

import { DATE_FORMAT } from '@/constants/date';
import { formatAttendanceTime } from '@/features/attendance/domain/format';
import type { OwnerAttendanceRow } from '@/features/attendance/types';

export type AttendanceDateSection = {
  key: string;
  title: string;
  date: string;
  data: OwnerAttendanceRow[];
};

export function groupAttendanceByDate(rows: OwnerAttendanceRow[]): AttendanceDateSection[] {
  const map = new Map<string, OwnerAttendanceRow[]>();

  for (const row of rows) {
    const dateKey = row.attendance_date.slice(0, 10);
    const bucket = map.get(dateKey) ?? [];
    bucket.push(row);
    map.set(dateKey, bucket);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, data]) => ({
      key: dateKey,
      date: dateKey,
      title: formatSectionTitle(dateKey),
      data: data.sort((a, b) => b.attendance_time.localeCompare(a.attendance_time)),
    }));
}

function formatSectionTitle(dateKey: string): string {
  try {
    return format(parseISO(`${dateKey}T12:00:00`), DATE_FORMAT.long);
  } catch {
    return dateKey;
  }
}

export function flattenAttendanceSections(sections: AttendanceDateSection[]): OwnerAttendanceRow[] {
  return sections.flatMap((section) => section.data);
}

export function formatHistoryItemSubtitle(row: OwnerAttendanceRow): string {
  const phone = row.member_phone?.trim();
  const time = formatAttendanceTime(row.attendance_time);
  return phone ? `${phone} · ${time}` : time;
}
