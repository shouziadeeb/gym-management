import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';

import { useAuthSession } from '@/hooks/useAuthSession';
import { useUserGyms } from '@/hooks/useUserGyms';
import { MemberTabNavigator } from '@/navigation/stacks/MemberTabNavigator';
import { OwnerTabNavigator } from '@/navigation/stacks/OwnerTabNavigator';
import type { RootStackParamList } from '@/navigation/types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <ActivityIndicator size="large" color="#16a34a" />
      <Text className="mt-4 text-slate-500 dark:text-slate-400">Loading your gyms…</Text>
    </View>
  );
}

export function RootNavigator() {
  useAuthSession();

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const appMode = useAppStore((state) => state.appMode);

  const { ownedGyms, memberGyms, isLoading } = useUserGyms();

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      {!session ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoading ? (
            <Stack.Screen name="Loading" component={LoadingScreen} />
          ) : ownedGyms.length === 0 && memberGyms.length === 0 ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : appMode === 'owner' && ownedGyms.length > 0 ? (
            <Stack.Screen name="Owner" component={OwnerTabNavigator} />
          ) : memberGyms.length > 0 ? (
            <Stack.Screen name="Member" component={MemberTabNavigator} />
          ) : (
            <Stack.Screen name="Owner" component={OwnerTabNavigator} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}