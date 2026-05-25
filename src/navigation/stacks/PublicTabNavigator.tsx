import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { AboutScreen } from '@/screens/public/AboutScreen';
import { HomeScreen } from '@/screens/public/HomeScreen';
import { PricingScreen } from '@/screens/public/PricingScreen';
import { TrainersScreen } from '@/screens/public/TrainersScreen';
import { createStackTabBarOptions } from '@/theme/navigation';

export type PublicTabParamList = {
  Home: undefined;
  Explore: undefined;
  Trainers: undefined;
  Pricing: undefined;
  About: undefined;
};

const Tab = createBottomTabNavigator<PublicTabParamList>();

export function PublicTabNavigator() {
  return (
    <Tab.Navigator screenOptions={createStackTabBarOptions()}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>H</Text> }} />
      <Tab.Screen
        name="Explore"
        component={HomeScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>E</Text> }}
      />
      <Tab.Screen
        name="Trainers"
        component={TrainersScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>T</Text> }}
      />
      <Tab.Screen
        name="Pricing"
        component={PricingScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>P</Text> }}
      />
      <Tab.Screen name="About" component={AboutScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 18 }}>A</Text> }} />
    </Tab.Navigator>
  );
}
