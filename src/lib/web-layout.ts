import { Platform, type ImageStyle, type ViewStyle } from 'react-native';

export const isWeb = Platform.OS === 'web';

/** Force RN Web views to span the full scene width (prevents centered narrow columns). */
export const webFullWidthStyle: ViewStyle = isWeb
  ? ({
      width: '100%',
      alignSelf: 'stretch',
    } as ViewStyle)
  : {};

/** RN Web: object-fit cover so full-bleed backgrounds fill the viewport. */
export const webImageCoverStyle: ImageStyle = isWeb
  ? ({
      objectFit: 'cover',
      objectPosition: 'center center',
    } as ImageStyle)
  : {};

/** RN Web: show the full photo without aggressive cropping. */
export const webImageContainStyle: ImageStyle = isWeb
  ? ({
      objectFit: 'contain',
      objectPosition: 'center center',
    } as ImageStyle)
  : {};

/** Scroll containers on RN Web: full width; clip horizontal bleed so rails don't shift layout. */
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

/** Clip variant for carousels that should not paint outside their viewport. */
export const webFullBleedClipStyle: ViewStyle = webFullBleedRailStyle;

/**
 * Break out of parent horizontal padding for edge-to-edge horizontal scroll.
 * Uses negative margins only — avoid calc() widths on web, which shift the page layout.
 */
export function fullBleedHorizontalStyle(edgePadding: number): ViewStyle {
  return {
    marginLeft: -edgePadding,
    marginRight: -edgePadding,
    alignSelf: 'stretch',
    overflow: 'hidden',
    ...(isWeb ? ({ minWidth: 0 } as ViewStyle) : null),
  };
}
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
