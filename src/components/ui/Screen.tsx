import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { screenLayout } from '@/theme/spacing';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({ children, scroll, className, refreshing = false, onRefresh }: Props) {
  const { colors } = useTheme();
  const backgroundColor = colors.background;

  const inner = scroll ? (
    <ScrollView
      className="flex-1 px-4"
      style={{ backgroundColor }}
      contentContainerStyle={{ paddingBottom: screenLayout.screenPaddingBottom }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
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
