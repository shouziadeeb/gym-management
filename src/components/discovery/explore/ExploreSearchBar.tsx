import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { inputSurface } from '@/theme/styles';
import { spacing } from '@/theme/spacing';

type Props = {
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
};

export function ExploreSearchBar({
  value,
  placeholder = 'Search name, category, or keyword',
  onChangeText,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <TextInput
        accessibilityLabel="Search gyms"
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        style={[styles.input, inputSurface(colors)]}
      />
      <View style={styles.icon} pointerEvents="none">
        <Search size={18} color={colors.muted} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  input: {
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingLeft: spacing[4],
    paddingRight: spacing[10],
    fontSize: 15,
  },
  icon: {
    position: 'absolute',
    right: spacing[3],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
