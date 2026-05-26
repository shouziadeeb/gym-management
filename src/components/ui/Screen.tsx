import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useScreenContentInsets } from '@/hooks/useScreenContentInsets';
import { useTheme } from '@/hooks/useTheme';
import { isWeb, webFullWidthStyle, webScrollContainerStyle } from '@/lib/web-layout';
import { screenLayout } from '@/theme/spacing';

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
  const horizontalPadding = screenLayout.screenPaddingX;

  /** Web mobile browsers don't need horizontal safe-area padding; it narrows tab content. */
  const safeEdges: Edge[] = omitTopSafeArea
    ? isWeb
      ? []
      : ['left', 'right']
    : isWeb
      ? ['top']
      : ['top', 'left', 'right'];

  const scrollContentStyle: ViewStyle = {
    paddingBottom: bottomInset,
    flexGrow: 1,
    ...(isWeb ? webFullWidthStyle : null),
  };

  const paddedContentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: horizontalPadding,
    backgroundColor,
    ...webFullWidthStyle,
  };

  const inner = scroll ? (
    <ScrollView
      style={[{ flex: 1, backgroundColor }, webScrollContainerStyle]}
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={!isWeb}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      <View style={paddedContentStyle} className={className}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={[paddedContentStyle, webScrollContainerStyle]} className={className}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor }, webFullWidthStyle]}
      edges={safeEdges}
    >
      {inner}
    </SafeAreaView>
  );
}

/** Bottom padding for nested lists (Explore FlatList) inside {@link Screen}. */
export function useScreenScrollBottomPadding(omitTopSafeArea?: boolean): number {
  return useScreenContentInsets({ omitTopSafeArea }).bottomInset;
}
