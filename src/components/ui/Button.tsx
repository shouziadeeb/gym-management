import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { buttons } from '@/theme/classes';
import { buttonLabelColor, buttonSurface } from '@/theme/styles';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const { colors } = useTheme();

  const spinnerColor = buttonLabelColor(colors, variant);

  return (
    <Pressable
      className={`${buttons.base} ${disabled || loading ? buttons.disabled : ''}`}
      style={buttonSurface(colors, variant)}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className="font-semibold" style={{ color: spinnerColor }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
