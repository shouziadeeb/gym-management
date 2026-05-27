import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ModalCard } from '@/components/ui/ModalCard';
import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface, textColor } from '@/theme/styles';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
}: Props<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className={layout.cardSpacing}>
      <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>

      <Pressable
        className={surfaces.input}
        style={cardSurface(colors)}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} dropdown`}
      >
        <Text style={{ color: selected ? colors.foreground : colors.placeholder }}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>

      <ModalCard visible={open} onClose={() => setOpen(false)} anchor="center">
        <Text className={`mb-3 ${text.cardTitle}`}>{label}</Text>
        {options.map((option) => (
          <Pressable
            key={option.value}
            className="mb-2 rounded-xl px-3 py-3"
            style={{
              backgroundColor: option.value === value ? colors.primary : colors.chipInactive,
            }}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <Text
              style={{
                color: option.value === value ? colors.primaryForeground : colors.foreground,
                fontWeight: option.value === value ? '600' : '400',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ModalCard>
    </View>
  );
}
