import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Bell, MoreVertical } from 'lucide-react-native';

import { useOpenProfileMenu } from '@/hooks/useOpenProfileMenu';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

export function ProfileHubHeader() {
  const { colors } = useTheme();
  const { triggerRef, openMenu } = useOpenProfileMenu();
  const { count } = useUnreadNotificationCount();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: spacing[2],
        marginBottom: spacing[4],
      }}
    >
      <Pressable
        onPress={() => router.push('/notifications' as never)}
        hitSlop={12}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
      >
        <Bell size={22} color={colors.foreground} strokeWidth={1.75} />
        {count > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              paddingHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.danger,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
              {count > 9 ? '9+' : count}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        ref={triggerRef}
        collapsable={false}
        onPress={openMenu}
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
        <MoreVertical size={22} color={colors.foreground} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}
