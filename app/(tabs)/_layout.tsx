import { Tabs } from 'expo-router';
import { Dumbbell, Home, Search, User } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { createTabBarOptions } from '@/theme/navigation';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const tabOptions = createTabBarOptions(isDark);

  return (
    <Tabs screenOptions={{ ...tabOptions, headerShown: false }}>
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
          tabBarIcon: ({ color, size }) => <User size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
