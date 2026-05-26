import { Text, View } from 'react-native';

import { toIsoDateString } from '@/features/profile/labels';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { textColor } from '@/theme/styles';

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

export function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: Props) {
  const { colors } = useTheme();

  return (
    <View className={layout.cardSpacing}>
      <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>
      <input
        type="date"
        value={value || ''}
        max={maximumDate ? toIsoDateString(maximumDate) : undefined}
        min={minimumDate ? toIsoDateString(minimumDate) : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${colors.borderInput}`,
          backgroundColor: colors.inputBackground,
          color: colors.foreground,
          fontSize: 16,
        }}
      />
    </View>
  );
}
