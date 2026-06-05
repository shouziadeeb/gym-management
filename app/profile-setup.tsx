import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ProfileSetupScreen } from '@/screens/onboarding/ProfileSetupScreen';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileSetupRoute() {
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!initialized || session) return;
    router.replace('/auth/login?redirect=/profile-setup&intent=profile' as never);
  }, [initialized, session]);

  if (!initialized || !session) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

  return <ProfileSetupScreen />;
}

