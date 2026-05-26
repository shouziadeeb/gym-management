import { ActivityIndicator, Text, View } from 'react-native';

import { surfaces, text } from '@/theme/classes';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = 'Loading…' }: LoadingScreenProps) {
  return (
    <View className={surfaces.loadingScreen} accessibilityRole="progressbar">
      <ActivityIndicator size="large" accessibilityLabel={label} />
      <Text className={`mt-3 ${text.loading}`}>{label}</Text>
    </View>
  );
}
