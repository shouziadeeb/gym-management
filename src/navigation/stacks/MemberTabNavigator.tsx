import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';
import { MemberProfileScreen } from '@/screens/member/MemberProfileScreen';
import { createStackTabBarOptions } from '@/theme/navigation';

export type MemberTabParamList = {
  Membership: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MemberTabParamList>();

export function MemberTabNavigator() {
  return (
    <Tab.Navigator screenOptions={createStackTabBarOptions()}>
      <Tab.Screen
        name="Membership"
        component={MemberHomeScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>M</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={MemberProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>P</Text> }}
      />
    </Tab.Navigator>
  );
}
