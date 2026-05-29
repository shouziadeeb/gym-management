import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { skeletonBlockColors } from '@/theme/styles';
import { spacing } from '@/theme/spacing';

type Props = {
  variant?: 'deck' | 'rail';
};

/** Placeholder card matching GymDiscoverCard layout with soft skeleton tones. */
export function GymDiscoverCardSkeleton({ variant = 'deck' }: Props) {
  const { colors, isDark } = useTheme();
  const skeleton = skeletonBlockColors(isDark);
  const railWidth = variant === 'rail' ? 280 : undefined;
  const imageHeight = variant === 'rail' ? 132 : 156;

  const cardStyle =
    variant === 'rail'
      ? { width: railWidth, alignSelf: 'flex-start' as const }
      : Platform.OS === 'web'
        ? { width: '100%' as const, alignSelf: 'stretch' as const }
        : { alignSelf: 'stretch' as const };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        cardStyle,
      ]}
    >
      <View style={[styles.imageFrame, { borderColor: colors.border, backgroundColor: skeleton.subtle }]}>
        <View style={[styles.imageBlock, { height: imageHeight, backgroundColor: skeleton.base }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={[styles.titleLine, { backgroundColor: skeleton.base }]} />
          <View style={[styles.badgeBlock, { backgroundColor: skeleton.base }]} />
        </View>
        <View style={[styles.lineMd, { backgroundColor: skeleton.base, width: '88%' }]} />
        <View style={[styles.lineSm, { backgroundColor: skeleton.base, width: '55%' }]} />
        <View style={[styles.lineSm, { backgroundColor: skeleton.base, width: '70%' }]} />
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: skeleton.base }]} />
          <View style={[styles.tag, { backgroundColor: skeleton.base }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  imageFrame: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  imageBlock: {
    width: '100%',
    borderRadius: 14,
  },
  body: {
    gap: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  titleLine: {
    flex: 1,
    height: 20,
    borderRadius: 8,
  },
  badgeBlock: {
    width: 52,
    height: 24,
    borderRadius: 999,
  },
  lineMd: {
    height: 14,
    borderRadius: 7,
  },
  lineSm: {
    height: 12,
    borderRadius: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  tag: {
    width: 64,
    height: 26,
    borderRadius: 999,
  },
});
