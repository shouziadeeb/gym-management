import { View } from 'react-native';

import { layout } from '@/theme/classes';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  variant?: 'deck' | 'rail';
};

export function GymDiscoverCardSkeleton({ variant = 'deck' }: Props) {
  const { colors } = useTheme();
  const railWidth = variant === 'rail' ? 280 : undefined;
  const imageHeight = variant === 'rail' ? 132 : 156;

  return (
    <View
      className={`${layout.cardSpacing} rounded-3xl border px-4 py-3`}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.card,
        width: railWidth,
      }}
    >
      <View className={`${layout.stackMd}`}>
        <View className={`rounded-2xl`} style={{ height: imageHeight, backgroundColor: colors.muted }} />
        <View className={`${layout.stack} h-6 rounded-lg`} style={{ backgroundColor: colors.muted }} />
        <View className="h-4 rounded-lg" style={{ backgroundColor: colors.muted, width: '65%' }} />
        <View className="h-3 rounded-lg" style={{ backgroundColor: colors.muted, width: '72%' }} />
      </View>
    </View>
  );
}
