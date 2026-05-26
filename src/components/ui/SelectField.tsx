import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface, modalOverlay, textColor } from '@/theme/styles';

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

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1" style={modalOverlay(colors)} onPress={() => setOpen(false)}>
          <Pressable
            className="mx-4 mt-32 rounded-2xl p-4"
            style={cardSurface(colors, true)}
            onPress={(event) => event.stopPropagation()}
          >
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
