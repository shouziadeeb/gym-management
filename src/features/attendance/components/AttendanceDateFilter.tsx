import { Pressable, Text, View } from 'react-native';

import { DatePickerField } from '@/components/ui/DatePickerField';
import { FullWidthHorizontalScroll } from '@/components/ui/FullWidthHorizontalScroll';
import {
  ATTENDANCE_PRESET_OPTIONS,
  ATTENDANCE_SORT_OPTIONS,
  type AttendanceHistoryPreset,
} from '@/features/attendance/domain/history-filters';
import type { AttendanceHistorySort } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  preset: AttendanceHistoryPreset;
  sort: AttendanceHistorySort;
  customDate: string;
  hasActiveFilters: boolean;
  onPresetChange: (preset: AttendanceHistoryPreset) => void;
  onSortChange: (sort: AttendanceHistorySort) => void;
  onCustomDateChange: (value: string) => void;
  onClear: () => void;
};

export function AttendanceDateFilter({
  preset,
  sort,
  customDate,
  hasActiveFilters,
  onPresetChange,
  onSortChange,
  onCustomDateChange,
  onClear,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing[2] }}>
      <FullWidthHorizontalScroll>
        {ATTENDANCE_PRESET_OPTIONS.map((option) => {
          const active = preset === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onPresetChange(option.value)}
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? colors.primaryForeground : colors.foreground }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </FullWidthHorizontalScroll>

      {preset === 'custom' ? (
        <DatePickerField
          label="Pick a date"
          value={customDate}
          onChange={onCustomDateChange}
          placeholder="Select attendance date"
        />
      ) : null}

      <FullWidthHorizontalScroll>
        {ATTENDANCE_SORT_OPTIONS.map((option) => {
          const active = sort === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSortChange(option.value)}
              className="rounded-full px-3 py-1.5"
              style={{
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? `${colors.primary}18` : colors.surface,
              }}
            >
              <Text className={`${text.caption} text-xs`} style={{ color: active ? colors.primary : colors.foregroundSecondary }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
        {hasActiveFilters ? (
          <Pressable
            onPress={onClear}
            className="rounded-full px-3 py-1.5"
            style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text className={`${text.caption} text-xs`}>Clear</Text>
          </Pressable>
        ) : null}
      </FullWidthHorizontalScroll>
    </View>
  );
}
