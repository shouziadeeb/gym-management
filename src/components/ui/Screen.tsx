import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { screenLayout } from '@/theme/spacing';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
};

export function Screen({ children, scroll, className }: Props) {
  const { colors } = useTheme();
  const backgroundColor = colors.background;

  const inner = scroll ? (
    <ScrollView
      className="flex-1 px-4"
      style={{ backgroundColor }}
      contentContainerStyle={{ paddingBottom: screenLayout.screenPaddingBottom }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-4 ${className ?? ''}`} style={{ backgroundColor }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor }} edges={['top', 'left', 'right']}>
      {inner}
    </SafeAreaView>
  );
}
