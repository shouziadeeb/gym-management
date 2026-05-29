/**
 * @file ProfileHubHeader.tsx
 * Top bar: notification / app menu action only (no duplicate branding).
 */
import { Pressable, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type ProfileHubHeaderProps = {
  onOpenMenu: () => void;
};

export function ProfileHubHeader({ onOpenMenu }: ProfileHubHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: spacing[4],
      }}
    >
      <Pressable
        onPress={onOpenMenu}
        hitSlop={12}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Open app menu"
      >
        <Bell size={22} color={colors.foreground} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}
