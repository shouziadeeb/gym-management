import '../global.css';

import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppProviders } from '@/AppProviders';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth.store';
import { webFullWidthStyle } from '@/lib/web-layout';
import { createNavigationTheme } from '@/theme/navigation';
import { layout, surfaces } from '@/theme/classes';

function GlobalBackButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const firstSegment = segments[0];
  const isTabsRoute = firstSegment === '(tabs)';
  const isRootIndex = !firstSegment;

  if (isTabsRoute || isRootIndex) return null;

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 12,
        paddingBottom: 4,
        backgroundColor: colors.background,
      }}
    >
      <Pressable
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)' as never);
        }}
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  useAuthSession();
  const { colors, isDark } = useTheme();
  const navTheme = createNavigationTheme(isDark);
  const initialized = useAuthStore((state) => state.initialized);

  return (
    <AppProviders>
      <ThemeProvider value={navTheme}>
        {!initialized ? (
          <View className={surfaces.loadingScreen} style={{ backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background, ...webFullWidthStyle }}>
            <GlobalBackButton />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'default',
                contentStyle: { backgroundColor: colors.background, flex: 1, width: '100%' },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="gym/[id]" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/signup" />
              <Stack.Screen name="profile-setup" />
              <Stack.Screen name="create-gym" />
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="manage-members" />
              <Stack.Screen name="analytics" />
              <Stack.Screen name="attendance" />
              <Stack.Screen name="attendance-scan" />
              <Stack.Screen name="attendance-history" />
              <Stack.Screen name="membership-lifecycle" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="bookings" />
              <Stack.Screen name="pricing" />
              <Stack.Screen name="about" />
              <Stack.Screen name="trainers" />
              <Stack.Screen name="settings" />
            </Stack>
          </View>
        )}
      </ThemeProvider>
    </AppProviders>
  );
}
