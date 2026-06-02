import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces, text } from '@/theme/classes';
import { inputSurface, textColor } from '@/theme/styles';

type Props = {
  label: string;
  value: string | undefined;
  onChangeText?: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  autoComplete?: 'email' | 'password' | 'off';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  editable?: boolean;
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
  autoComplete,
  editable = true,
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
        editable={editable}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
    </View>
  );
}
