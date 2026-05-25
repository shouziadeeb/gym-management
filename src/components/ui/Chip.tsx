import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { surfaces } from '@/theme/classes';
import { chipLabelColor, chipSurface } from '@/theme/styles';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function Chip({ label, active, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable className={surfaces.chip} style={chipSurface(colors, active)} onPress={onPress}>
      <Text className="font-semibold" style={{ color: chipLabelColor(colors, active) }}>
        {label}
      </Text>
    </Pressable>
  );
}
