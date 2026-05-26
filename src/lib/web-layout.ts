import { Platform, type ViewStyle } from 'react-native';

export const isWeb = Platform.OS === 'web';

/** Force RN Web views to span the full scene width (prevents centered narrow columns). */
export const webFullWidthStyle: ViewStyle = isWeb
  ? ({
      width: '100%',
      alignSelf: 'stretch',
    } as ViewStyle)
  : {};

/** Scroll containers on RN Web: clip horizontal bleed and hide scrollbars. */
export const webScrollContainerStyle: ViewStyle = isWeb
  ? ({
      ...webFullWidthStyle,
      overflowX: 'hidden',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    } as ViewStyle)
  : {};
/** Wrapper for full-bleed horizontal rails that break out of screen padding. */
export const webFullBleedRailStyle: ViewStyle = {
  overflow: 'hidden',
  ...webFullWidthStyle,
};
/** Fixed-width carousel page — prevents flex-shrink showing multiple slides on web. */
export function carouselPageStyle(pageWidth: number): ViewStyle {
  return {
    width: pageWidth,
    flexShrink: 0,
    flexGrow: 0,
  };
}

/** Horizontal paging list bound to a measured viewport width. */
export function horizontalPagingListStyle(viewportWidth: number): ViewStyle {
  return {
    ...carouselPageStyle(viewportWidth),
    overflow: 'hidden',
    ...webScrollContainerStyle,
  };
}

/** Extra styles for horizontal ScrollView / FlatList paging on web. */
export const webHorizontalPagingStyle: ViewStyle = isWeb
  ? ({
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
    } as ViewStyle)
  : {};

export const webHorizontalPageStyle: ViewStyle = isWeb
  ? ({
      scrollSnapAlign: 'start',
    } as ViewStyle)
  : {};
