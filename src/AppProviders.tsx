import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, colorScheme as nativewindColorScheme } from 'nativewind';

import { queryClient } from '@/api/queries/client';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useNotificationBootstrap } from '@/hooks/useNotificationBootstrap';
import { useTheme } from '@/hooks/useTheme';
import { GymFollowProvider } from '@/features/gym-follows/GymFollowProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { webFullWidthStyle } from '@/lib/web-layout';
import { AuthProvider } from '@/providers/AuthProvider';

function NotificationBootstrap() {
  useNotificationBootstrap();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const { colors, isDark, colorScheme, preference } = useTheme();

  useEffect(() => {
    // Ensure NativeWind dark: classes work consistently on web and native.
    const nativewindStyleSheet = StyleSheet as unknown as {
      setFlag?: (name: string, value: string) => void;
    };
    nativewindStyleSheet.setFlag?.('darkMode', 'class');
    // Apply resolved scheme so dark: classes always match runtime colors.
    nativewindColorScheme.set(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBackgroundColor('transparent');
    RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [isDark]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background, ...webFullWidthStyle }}>
      <SafeAreaProvider style={{ flex: 1, ...webFullWidthStyle }}>
        <View style={{ flex: 1, backgroundColor: colors.background, ...webFullWidthStyle }}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <AuthProvider>
                <I18nProvider>
                  <GymFollowProvider>
                    <NotificationBootstrap />
                    <StatusBar style={isDark ? 'light' : 'dark'} />
                    {children}
                  </GymFollowProvider>
                </I18nProvider>
              </AuthProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
