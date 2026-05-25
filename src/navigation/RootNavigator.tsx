import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuthSession } from '@/hooks/useAuthSession';
import { useTheme } from '@/hooks/useTheme';
import { useUserGyms } from '@/hooks/useUserGyms';
import { PublicTabNavigator } from '@/navigation/stacks/PublicTabNavigator';
import { MemberTabNavigator } from '@/navigation/stacks/MemberTabNavigator';
import { OwnerTabNavigator } from '@/navigation/stacks/OwnerTabNavigator';
import type { RootStackParamList } from '@/navigation/types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { GymDetailScreen } from '@/screens/public/GymDetailScreen';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { HomeScreen } from '@/screens/public/HomeScreen';
import { useAuthIntentStore } from '@/store/auth-intent.store';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { createNavigationTheme } from '@/theme/navigation';
import { layout, surfaces, text } from '@/theme/classes';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View className={surfaces.loadingScreen}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className={`${layout.stackLg} ${text.loading}`}>Loading your gyms�</Text>
    </View>
  );
}

export function RootNavigator() {
  useAuthSession();

  const { colors, isDark } = useTheme();
  const theme = createNavigationTheme(isDark);

  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const appMode = useAppStore((state) => state.appMode);
  const pendingIntent = useAuthIntentStore((state) => state.pendingIntent);

  const { ownedGyms, memberGyms, isLoading } = useUserGyms();

  const isAuthenticated = Boolean(session);
  const hasOwnerGym = ownedGyms.length > 0;
  const hasMemberGym = memberGyms.length > 0;

  const shouldRouteToAuth = !isAuthenticated && Boolean(pendingIntent);
  const shouldOpenOwnerOnboarding = isAuthenticated && pendingIntent === 'create_gym' && !hasOwnerGym;
  const shouldOpenOwnerArea = isAuthenticated && (pendingIntent === 'owner_dashboard' || (appMode === 'owner' && hasOwnerGym));
  const shouldOpenMemberArea = isAuthenticated && (pendingIntent === 'member_dashboard' || (appMode === 'member' && hasMemberGym));
  const shouldOpenMemberOnboarding =
    isAuthenticated &&
    (pendingIntent === 'join_gym' || pendingIntent === 'buy_membership' || pendingIntent === 'member_dashboard') &&
    !hasMemberGym;

  if (!initialized) {
    return (
      <View className={surfaces.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      {!isAuthenticated && !shouldRouteToAuth ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={PublicTabNavigator} />
          <Stack.Screen name="GymDetail" component={GymDetailScreen} />
        </Stack.Navigator>
      ) : !isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoading ? (
            <Stack.Screen name="Loading" component={LoadingScreen} />
          ) : shouldOpenMemberOnboarding ? (
            <Stack.Screen name="MemberOnboarding" component={HomeScreen} />
          ) : shouldOpenOwnerOnboarding ? (
            <Stack.Screen name="OwnerOnboarding" component={OnboardingScreen} />
          ) : shouldOpenOwnerArea ? (
            <Stack.Screen name="Owner" component={OwnerTabNavigator} />
          ) : shouldOpenMemberArea ? (
            <Stack.Screen name="Member" component={MemberTabNavigator} />
          ) : hasMemberGym ? (
            <Stack.Screen name="Member" component={MemberTabNavigator} />
          ) : hasOwnerGym ? (
            <Stack.Screen name="Owner" component={OwnerTabNavigator} />
          ) : (
            <>
              <Stack.Screen name="Home" component={PublicTabNavigator} />
              <Stack.Screen name="GymDetail" component={GymDetailScreen} />
            </>
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
