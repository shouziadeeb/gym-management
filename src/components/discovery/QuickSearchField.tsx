import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { layout, surfaces } from '@/theme/classes';
import { inputSurface } from '@/theme/styles';

type Props = {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSubmitEditing?: () => void;
};

export function QuickSearchField({ value, placeholder, onChangeText, onSubmitEditing }: Props) {
  const { colors } = useTheme();

  return (
    <View className={layout.cardSpacing}>
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        className={surfaces.inputCompact}
        style={inputSurface(colors)}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize="none"
      />
    </View>
  );
}
