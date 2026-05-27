import { useMemo, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  ATTENDANCE_PRESET_OPTIONS,
  ATTENDANCE_SORT_OPTIONS,
  resolvePresetRange,
  type AttendanceHistoryPreset,
} from '@/features/attendance/domain/history-filters';
import type { AttendanceHistorySort } from '@/features/attendance/types';

export function useAttendanceHistorySearch(defaultDelayMs = 350) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, defaultDelayMs);

  return {
    search,
    debouncedSearch,
    setSearch: (value: string) => setSearch(value),
    clearSearch: () => setSearch(''),
  };
}

export function useAttendanceHistoryFilters() {
  const [preset, setPreset] = useState<AttendanceHistoryPreset>('all');
  const [customDate, setCustomDate] = useState('');
  const [sort, setSort] = useState<AttendanceHistorySort>('newest');

  const range = useMemo(() => resolvePresetRange(preset, customDate || undefined), [customDate, preset]);

  function selectPreset(next: AttendanceHistoryPreset) {
    setPreset(next);
    if (next !== 'custom') setCustomDate('');
  }

  function clearFilters() {
    setPreset('all');
    setCustomDate('');
    setSort('newest');
  }

  const hasActiveFilters = preset !== 'all' || sort !== 'newest';

  return {
    preset,
    customDate,
    sort,
    range,
    presetOptions: ATTENDANCE_PRESET_OPTIONS,
    sortOptions: ATTENDANCE_SORT_OPTIONS,
    setPreset: selectPreset,
    setCustomDate,
    setSort,
    clearFilters,
    hasActiveFilters,
  };
}
