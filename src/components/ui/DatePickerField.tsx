import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ModalCard } from '@/components/ui/ModalCard';
import { formatDateLabel, parseIsoDate, toIsoDateString } from '@/features/profile/labels';
import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface, textColor } from '@/theme/styles';

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  maximumDate,
  minimumDate,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const initial = useMemo(() => parseIsoDate(value) ?? new Date(2000, 0, 1), [value]);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [day, setDay] = useState(initial.getDate());

  const displayValue = value ? formatDateLabel(value) : placeholder;

  const minYear = minimumDate ? minimumDate.getFullYear() : 1920;
  const maxYear = maximumDate ? maximumDate.getFullYear() : new Date().getFullYear();

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const maxDay = daysInMonth(year, month);
  const clampedDay = Math.min(day, maxDay);

  function handleOpen() {
    const d = parseIsoDate(value) ?? new Date(2000, 0, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setDay(d.getDate());
    setOpen(true);
  }

  function handleConfirm() {
    const finalDay = Math.min(day, daysInMonth(year, month));
    const selected = new Date(year, month, finalDay);

    if (maximumDate && selected > maximumDate) {
      onChange(toIsoDateString(maximumDate));
    } else if (minimumDate && selected < minimumDate) {
      onChange(toIsoDateString(minimumDate));
    } else {
      onChange(toIsoDateString(selected));
    }
    setOpen(false);
  }

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? colors.primary : 'transparent',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  });

  const pillText = (active: boolean) => ({
    color: active ? colors.primaryForeground : colors.foreground,
    fontWeight: active ? ('600' as const) : ('400' as const),
    textAlign: 'center' as const,
  });

  return (
    <View className={layout.cardSpacing}>
      <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>

      <Pressable
        className={surfaces.input}
        style={cardSurface(colors)}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`${label} date picker`}
      >
        <Text style={{ color: value ? colors.foreground : colors.placeholder }}>{displayValue}</Text>
      </Pressable>

      <ModalCard visible={open} onClose={() => setOpen(false)} anchor="center">
            <Text className={`mb-3 ${text.cardTitle}`}>{label}</Text>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              Year
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-1">
                {years.map((y) => (
                  <Pressable key={y} onPress={() => setYear(y)} style={pillStyle(y === year)}>
                    <Text style={pillText(y === year)}>{y}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              Month
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-1">
                {MONTHS.map((m, i) => (
                  <Pressable key={m} onPress={() => setMonth(i)} style={pillStyle(i === month)}>
                    <Text style={pillText(i === month)}>{m.slice(0, 3)}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              Day
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-1">
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <Pressable key={d} onPress={() => setDay(d)} style={pillStyle(d === clampedDay)}>
                    <Text style={pillText(d === clampedDay)}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Pressable
                  className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: 'transparent', borderColor: colors.ghostBorder, borderWidth: 1 }}
                  onPress={() => setOpen(false)}
                >
                  <Text style={{ color: colors.foreground, textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleConfirm}
                >
                  <Text style={{ color: colors.primaryForeground, textAlign: 'center', fontWeight: '600' }}>Confirm</Text>
                </Pressable>
              </View>
            </View>
      </ModalCard>
    </View>
  );
}
