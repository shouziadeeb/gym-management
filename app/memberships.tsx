import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { routes } from '@/routing/constants';

/** Legacy stack path — always land on the Memberships tab. */
export default function MembershipsRoute() {
  useEffect(() => {
    router.replace(routes.memberships as never);
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator accessibilityLabel="Loading" />
    </View>
  );
}
