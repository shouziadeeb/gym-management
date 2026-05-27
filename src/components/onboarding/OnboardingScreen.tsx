import type { ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingFlowBackground } from '@/components/onboarding/OnboardingFlowBackground';
import { Screen } from '@/components/ui/Screen';

type Props = ComponentProps<typeof Screen>;

/** Scrollable screen with shared onboarding photo + blue blur background. */
export function OnboardingScreen(props: Props) {
  return (
    <OnboardingFlowBackground>
      <StatusBar style="light" translucent={Platform.OS === 'android'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <OnboardingBackButton />
        <View style={{ flex: 1 }}>
          <Screen {...props} transparentBackground omitTopSafeArea />
        </View>
      </SafeAreaView>
    </OnboardingFlowBackground>
  );
}
