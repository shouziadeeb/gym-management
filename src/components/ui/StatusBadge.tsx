import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/theme/colors';

export type StatusTone = 'active' | 'expiring' | 'expired' | 'cancelled' | 'neutral';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

function toneColors(colors: ThemeColors, tone: StatusTone): { bg: string; fg: string } {
  switch (tone) {
    case 'active':
      return { bg: colors.successMuted, fg: colors.successForeground };
    case 'expiring':
      return { bg: colors.warningMuted, fg: colors.warningForeground };
    case 'expired':
      return { bg: 'rgba(220, 38, 38, 0.15)', fg: colors.danger };
    case 'cancelled':
      return { bg: colors.chipInactive, fg: colors.foregroundSecondary };
    default:
      return { bg: colors.chipInactive, fg: colors.foregroundSecondary };
  }
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const { colors } = useTheme();
  const palette = toneColors(colors, tone);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
