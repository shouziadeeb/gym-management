import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useScreenContentInsets } from '@/hooks/useScreenContentInsets';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  /**
   * Use on stack screens that already render {@link GlobalBackButton} (gym detail, etc.)
   * so top safe-area is not applied twice.
   */
  omitTopSafeArea?: boolean;
};

export function Screen({
  children,
  scroll,
  className,
  refreshing = false,
  onRefresh,
  omitTopSafeArea = false,
}: Props) {
  const { colors } = useTheme();
  const { bottomInset } = useScreenContentInsets({ omitTopSafeArea });
  const backgroundColor = colors.background;

  const safeEdges: Edge[] = omitTopSafeArea
    ? ['left', 'right']
    : ['top', 'left', 'right'];

  const scrollContentStyle: ViewStyle = {
    paddingBottom: bottomInset,
    flexGrow: 1,
  };

  const inner = scroll ? (
    <ScrollView
      className="flex-1 px-4"
      style={{ backgroundColor }}
      contentContainerStyle={scrollContentStyle}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-4 ${className ?? ''}`} style={{ backgroundColor }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor }} edges={safeEdges}>
      {inner}
    </SafeAreaView>
  );
}

/** Bottom padding for nested lists (Explore FlatList) inside {@link Screen}. */
export function useScreenScrollBottomPadding(omitTopSafeArea?: boolean): number {
  return useScreenContentInsets({ omitTopSafeArea }).bottomInset;
}
