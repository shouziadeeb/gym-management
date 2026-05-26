import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import {
  TIME_PICKER_HOURS,
  TIME_PICKER_MINUTES,
  format24,
  formatDisplay,
  parse24,
  snapToPickerMinute,
  to12,
  to24,
} from '@/components/ui/time-picker-utils';
import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface, modalOverlay, textColor } from '@/theme/styles';

type Props = {
  label: string;
  /** 24-hour format string like "06:00" or "14:30" */
  value: string;
  onChange: (time24: string) => void;
  placeholder?: string;
};

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select time',
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const parsed = useMemo(() => parse24(value), [value]);
  const initial12 = useMemo(() => to12(parsed.hour), [parsed.hour]);

  const [hour12, setHour12] = useState(initial12.hour12);
  const [minute, setMinute] = useState(() => snapToPickerMinute(parsed.minute));
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial12.period);

  const displayValue = value ? formatDisplay(value) : placeholder;

  function handleOpen() {
    const current = parse24(value);
    const converted = to12(current.hour);
    setHour12(converted.hour12);
    setMinute(snapToPickerMinute(current.minute));
    setPeriod(converted.period);
    setOpen(true);
  }

  function handleConfirm() {
    const hour24 = to24(hour12, period);
    onChange(format24(hour24, minute));
    setOpen(false);
  }

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? colors.primary : 'transparent',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 48,
    alignItems: 'center' as const,
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
        accessibilityLabel={`${label} time picker`}
      >
        <Text style={{ color: value ? colors.foreground : colors.placeholder }}>{displayValue}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1" style={modalOverlay(colors)} onPress={() => setOpen(false)}>
          <View
            className="mx-4 mt-24 rounded-2xl p-4"
            style={cardSurface(colors, true)}
            onStartShouldSetResponder={() => true}
          >
            <Text className={`mb-3 ${text.cardTitle}`}>{label}</Text>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              AM / PM
            </Text>
            <View className="mb-3 flex-row gap-2">
              {(['AM', 'PM'] as const).map((part) => (
                <Pressable key={part} onPress={() => setPeriod(part)} style={pillStyle(part === period)}>
                  <Text style={pillText(part === period)}>{part}</Text>
                </Pressable>
              ))}
            </View>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              Hour
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-1">
                {TIME_PICKER_HOURS.map((hour) => (
                  <Pressable
                    key={hour}
                    onPress={() => setHour12(hour)}
                    style={pillStyle(hour === hour12)}
                  >
                    <Text style={pillText(hour === hour12)}>{hour}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
              Minute
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-1">
                {TIME_PICKER_MINUTES.map((part) => (
                  <Pressable
                    key={part}
                    onPress={() => setMinute(part)}
                    style={pillStyle(part === minute)}
                  >
                    <Text style={pillText(part === minute)}>{String(part).padStart(2, '0')}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="mb-4 items-center">
              <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700' }}>
                {hour12}:{String(minute).padStart(2, '0')} {period}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Pressable
                  className="rounded-xl px-3 py-3"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.ghostBorder,
                    borderWidth: 1,
                  }}
                  onPress={() => setOpen(false)}
                >
                  <Text style={{ color: colors.foreground, textAlign: 'center', fontWeight: '600' }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
              <View className="flex-1">
                <Pressable
                  className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleConfirm}
                >
                  <Text style={{ color: colors.primaryForeground, textAlign: 'center', fontWeight: '600' }}>
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
