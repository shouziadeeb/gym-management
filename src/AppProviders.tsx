import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queries/client';
import { useRegisterPush } from '@/hooks/useRegisterPush';

function PushBootstrap() {
  useRegisterPush();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PushBootstrap />
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}