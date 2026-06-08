import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useGymFollow } from '@/features/gym-follows/GymFollowProvider';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Props = {
  gymId: string;
  compact?: boolean;
  /** Stretch to fill the parent row (e.g. beside Connect). */
  fullWidth?: boolean;
};

export function GymFollowButton({ gymId, compact = false, fullWidth = false }: Props) {
  const { colors } = useTheme();
  const { isFollowing, isPending, toggleFollow } = useGymFollow();

  const following = isFollowing(gymId);
  const loading = isPending(gymId);

  const faceStyle = following
    ? {
        backgroundColor: colors.chipInactive,
        borderColor: colors.border,
      }
    : {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };

  const label = loading ? 'Saving…' : following ? 'Following' : 'Follow';

  return (
    <Pressable
      onPress={() => void toggleFollow(gymId)}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={following ? `Unfollow gym` : `Follow gym`}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        compact && styles.compactSlot,
      ]}
    >
      <View
        style={[
          styles.face,
          compact && styles.faceCompact,
          faceStyle,
          loading && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            { color: following ? colors.foreground : colors.primaryForeground },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    flex: 1,
  },
  compactSlot: {
    alignSelf: 'flex-start',
  },
  face: {
    minHeight: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCompact: {
    minHeight: 34,
    paddingHorizontal: spacing[3],
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
});
