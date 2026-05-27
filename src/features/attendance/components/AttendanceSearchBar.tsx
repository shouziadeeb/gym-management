import { Search, X } from 'lucide-react-native';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
};

export function AttendanceSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search name or phone',
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center rounded-2xl border px-3"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.inputBackground,
        minHeight: 48,
        overflow: 'hidden',
      }}
    >
      <Search size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{
          flex: 1,
          marginLeft: spacing[2],
          paddingVertical: spacing[2.5],
          color: colors.foreground,
          fontSize: 16,
          backgroundColor: 'transparent',
          borderWidth: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const } : null),
        }}
      />
      {value.length > 0 && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
          <X size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
