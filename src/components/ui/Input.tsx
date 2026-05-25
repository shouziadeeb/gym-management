import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { inputSurface, textColor } from '@/theme/styles';

type Props = {
  label: string;
  value: string | undefined;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
};

export function Input({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  keyboardType = 'default',
  secureTextEntry,
  autoCapitalize = 'none',
}: Props) {
  const { colors } = useTheme();

  return (
    <View className={layout.cardSpacing}>
      <Text className={`mb-1 ${text.label}`} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>
      <TextInput
        className={surfaces.input}
        style={inputSurface(colors)}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value ?? ''}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}
