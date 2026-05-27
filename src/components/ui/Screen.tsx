import { useSegments } from 'expo-router';
import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

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

function resolveSafeAreaEdges(omitTopSafeArea: boolean, inTabs: boolean): Edge[] {
  if (inTabs) {
    return isWeb ? ['top'] : ['top', 'left', 'right'];
  }

  if (omitTopSafeArea) {
    return isWeb ? ['bottom', 'left', 'right'] : ['bottom', 'left', 'right'];
  }

  return isWeb ? ['top', 'bottom'] : ['top', 'bottom', 'left', 'right'];
}

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
  const { colors } = useTheme();
  const omitTopSafeArea = omitTopSafeAreaProp ?? shouldOmitTopSafeAreaForRoute(segments);
  const { bottomInset, contentTopGap, inTabs } = useScreenContentInsets({ omitTopSafeArea });
  const backgroundColor = transparentBackground ? 'transparent' : colors.background;
  const horizontalPadding = screenLayout.screenPaddingX;
  const safeEdges = resolveSafeAreaEdges(omitTopSafeArea, inTabs);

  const scrollContentStyle: ViewStyle = {
    paddingTop: contentTopGap,
    paddingBottom: bottomInset,
    flexGrow: 1,
    ...(isWeb ? webFullWidthStyle : null),
  };

  const paddedContentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: horizontalPadding,
    paddingTop: scroll ? 0 : contentTopGap,
    paddingBottom: scroll ? 0 : bottomInset,
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
