import { useSegments } from 'expo-router';
import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenContentInsets } from '@/hooks/useScreenContentInsets';
import { useTheme } from '@/hooks/useTheme';
import { shouldOmitTopSafeAreaForRoute } from '@/lib/safe-area';
import { isWeb, webFullWidthStyle, webScrollContainerStyle } from '@/lib/web-layout';
import { screenLayout } from '@/theme/spacing';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  /**
   * Stack routes with {@link GlobalBackButton} skip top safe-area by default.
   * Pass `false` to force status-bar padding (rare).
   */
  omitTopSafeArea?: boolean;
  /** Let a parent background (e.g. onboarding photo) show through. */
  transparentBackground?: boolean;
};

export function Screen({
  children,
  scroll,
  className,
  refreshing = false,
  onRefresh,
  omitTopSafeArea: omitTopSafeAreaProp,
  transparentBackground = false,
}: Props) {
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const omitTopSafeArea = omitTopSafeAreaProp ?? shouldOmitTopSafeAreaForRoute(segments);
  const { topInset, bottomInset, contentTopGap } = useScreenContentInsets({ omitTopSafeArea });
  const backgroundColor = transparentBackground ? 'transparent' : colors.background;
  const horizontalPadding = screenLayout.screenPaddingX;
  const horizontalEdges = isWeb ? ([] as const) : (['left', 'right'] as const);
  const useDesktopContentFrame = isWeb && width >= 1024;

  const shellStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: topInset,
    ...webFullWidthStyle,
  };

  const paddedContentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: horizontalPadding,
    paddingTop: contentTopGap,
    paddingBottom: scroll ? 0 : bottomInset,
    backgroundColor,
    ...webFullWidthStyle,
    ...(useDesktopContentFrame
      ? {
          maxWidth: 1280,
          alignSelf: 'center',
        }
      : null),
  };

  const scrollContentStyle: ViewStyle = {
    paddingBottom: bottomInset,
    flexGrow: 1,
    ...(isWeb ? webFullWidthStyle : null),
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
      <View style={paddedContentStyle} className={`w-full ${className ?? ''}`}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={[paddedContentStyle, webScrollContainerStyle]} className={`w-full ${className ?? ''}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={shellStyle} edges={horizontalEdges}>
      {inner}
    </SafeAreaView>
  );
}

/** Bottom padding for nested lists (Explore FlatList) inside {@link Screen}. */
export function useScreenScrollBottomPadding(omitTopSafeArea?: boolean): number {
  return useScreenContentInsets({ omitTopSafeArea }).bottomInset;
}
