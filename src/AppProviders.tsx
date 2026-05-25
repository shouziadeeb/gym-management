import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, colorScheme as nativewindColorScheme } from 'nativewind';

import { queryClient } from '@/api/queries/client';
import { useRegisterPush } from '@/hooks/useRegisterPush';
import { useTheme } from '@/hooks/useTheme';

function PushBootstrap() {
  useRegisterPush();
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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <QueryClientProvider client={queryClient}>
            <PushBootstrap />
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {children}
          </QueryClientProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
