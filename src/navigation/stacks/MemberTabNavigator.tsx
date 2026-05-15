import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { MemberHomeScreen } from '@/screens/member/MemberHomeScreen';
import { MemberProfileScreen } from '@/screens/member/MemberProfileScreen';

export type MemberTabParamList = {
  Membership: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MemberTabParamList>();

export function MemberTabNavigator() {
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