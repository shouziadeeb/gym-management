import { format, parseISO } from 'date-fns';

import { DATE_FORMAT } from '@/constants/date';

function parseAttendanceTimestamp(value: string): Date | null {
  if (!value?.trim()) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  try {
    const parsed = parseISO(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  } catch {
    // fall through
  }

  return null;
}

/** Format YYYY-MM-DD attendance date for display. */
export function formatAttendanceDate(value: string): string {
  try {
    return format(parseISO(value.length === 10 ? `${value}T12:00:00` : value), DATE_FORMAT.long);
  } catch {
    return value;
  }
}

export function formatAttendanceTime(value: string): string {
  const moment = parseAttendanceTimestamp(value);
  if (moment) return format(moment, 'h:mm a');
  return value;
}

/** Derive date and clock from attendance_time so UTC-stored rows display in local time. */
export function formatAttendanceDateTime(date: string, time: string): string {
  const moment = parseAttendanceTimestamp(time);
  if (moment) {
    return `${format(moment, DATE_FORMAT.long)} · ${format(moment, 'h:mm a')}`;
  }

  return `${formatAttendanceDate(date)} · ${formatAttendanceTime(time)}`;
}

/** Device-local calendar date sent to Supabase when marking attendance. */
export function getLocalAttendanceDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
