import { Dumbbell, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  followerCount: number;
  activeMemberCount: number;
  compact?: boolean;
};

function formatCount(value: number): string {
  return value.toLocaleString();
}

export function GymStatsRow({ followerCount, activeMemberCount, compact = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.stat}>
        <Users size={compact ? 14 : 16} color={colors.muted} strokeWidth={2} />
        <Text style={[styles.text, compact && styles.textCompact, { color: colors.foreground }]}>
          {formatCount(followerCount)} Followers
        </Text>
      </View>
      <View style={styles.stat}>
        <Dumbbell size={compact ? 14 : 16} color={colors.muted} strokeWidth={2} />
        <Text style={[styles.text, compact && styles.textCompact, { color: colors.foreground }]}>
          {formatCount(activeMemberCount)} Members
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  rowCompact: {
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  textCompact: {
    fontSize: 12,
  },
});
