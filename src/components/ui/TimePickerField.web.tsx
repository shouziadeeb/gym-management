import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { textColor } from '@/theme/styles';

type Props = {
  label: string;
  /** 24-hour format string like "06:00" or "14:30" */
  value: string;
  onChange: (time24: string) => void;
  placeholder?: string;
};

export function TimePickerField({ label, value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View className={layout.cardSpacing}>
      <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>
      <input
        type="time"
        value={value || ''}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${colors.borderInput}`,
          backgroundColor: colors.inputBackground,
          color: colors.foreground,
          fontSize: 16,
          boxSizing: 'border-box',
          colorScheme: colors.background === '#0f172a' || colors.background === '#020617' ? 'dark' : 'light',
        }}
      />
    </View>
  );
}
