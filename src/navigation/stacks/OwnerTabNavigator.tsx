import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { GymSettingsScreen } from '@/screens/owner/GymSettingsScreen';
import { MembersScreen } from '@/screens/owner/MembersScreen';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';
import { createStackTabBarOptions } from '@/theme/navigation';

export type OwnerTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  Gym: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export function OwnerTabNavigator() {
  return (
    <Tab.Navigator screenOptions={createStackTabBarOptions()}>
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
