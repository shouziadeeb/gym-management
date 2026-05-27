import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

import { DATE_FORMAT } from '@/constants/date';

import type { AttendanceHistorySort } from '@/features/attendance/types';

export type AttendanceHistoryPreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export type AttendanceDateRange = {
  from?: string;
  to?: string;
};

export function isoDate(value: Date): string {
  return format(value, DATE_FORMAT.isoDate);
}

export function resolvePresetRange(preset: AttendanceHistoryPreset, customDate?: string): AttendanceDateRange {
  const today = new Date();

  switch (preset) {
    case 'today':
      return { from: isoDate(today), to: isoDate(today) };
    case 'yesterday': {
      const day = subDays(today, 1);
      return { from: isoDate(day), to: isoDate(day) };
    }
    case 'week':
      return {
        from: isoDate(startOfWeek(today, { weekStartsOn: 1 })),
        to: isoDate(endOfWeek(today, { weekStartsOn: 1 })),
      };
    case 'month':
      return { from: isoDate(startOfMonth(today)), to: isoDate(endOfMonth(today)) };
    case 'custom':
      return customDate ? { from: customDate, to: customDate } : {};
    case 'all':
    default:
      return {};
  }
}

export const ATTENDANCE_SORT_OPTIONS: { value: AttendanceHistorySort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'checkin_latest', label: 'Latest check-in' },
  { value: 'name_asc', label: 'Name A–Z' },
];

export const ATTENDANCE_PRESET_OPTIONS: { value: AttendanceHistoryPreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];
