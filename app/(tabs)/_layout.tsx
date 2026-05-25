import { Tabs } from 'expo-router';
import { Dumbbell, Home, Search, User } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { createTabBarOptions } from '@/theme/navigation';
import { useProfileMenuStore } from '@/store/profile-menu.store';

export default function TabsLayout() {
  const { isDark, colors } = useTheme();
  const tabOptions = createTabBarOptions(isDark);
  const openProfileMenu = useProfileMenuStore((state) => state.open);

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Search size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="memberships"
        options={{
          title: 'Memberships',
          tabBarIcon: ({ color, size }) => <Dumbbell size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile-hub"
        options={{
          title: 'Profile',
          headerRightContainerStyle: { paddingRight: 12 },
          headerRight: () => (
            <Pressable
              onPress={openProfileMenu}
              style={{ paddingHorizontal: 6, paddingVertical: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Open profile menu"
            >
              <Text style={{ color: colors.foreground, fontSize: 24, lineHeight: 24 }}>⋮</Text>
            </Pressable>
          ),
          tabBarIcon: ({ color, size }) => <User size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
