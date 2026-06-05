import { Tabs } from 'expo-router';
import { Dumbbell, Home, Search, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { createTabBarOptions } from '@/theme/navigation';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const tabOptions = createTabBarOptions(isDark);

  return (
    <Tabs screenOptions={{ ...tabOptions, headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, size }) => <Search size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="memberships"
        options={{
          title: t('tabs.memberships'),
          tabBarIcon: ({ color, size }) => <Dumbbell size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile-hub"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
