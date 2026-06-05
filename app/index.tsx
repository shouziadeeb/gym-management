import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndexRoute() {
  useEffect(() => {
    router.replace('/(tabs)' as never);
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator accessibilityLabel="Loading" />
    </View>
  );
}
