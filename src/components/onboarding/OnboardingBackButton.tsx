import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { routes } from '@/routing/constants';
import { spacing } from '@/theme/spacing';

export function OnboardingBackButton() {
  const { colors } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(routes.profileHub as never);
  };

  return (
    <View
      style={{
        paddingTop: spacing[3],
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[2],
        backgroundColor: 'transparent',
      }}
    >
      <Pressable
        onPress={handleBack}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          backgroundColor: 'rgba(13, 13, 13, 0.35)',
        }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
