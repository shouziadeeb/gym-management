import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { GymSettingsScreen } from '@/screens/owner/GymSettingsScreen';
import { MembersScreen } from '@/screens/owner/MembersScreen';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';

export type OwnerTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  Gym: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>H</Text> }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>U</Text> }}
      />
      <Tab.Screen
        name="Gym"
        component={GymSettingsScreen}
        options={{ title: 'Gym', tabBarIcon: () => <Text style={{ fontSize: 18 }}>G</Text> }}
      />
    </Tab.Navigator>
  );
}