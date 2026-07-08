import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { isWeb, webFullWidthStyle } from '@/lib/web-layout';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { onboardingFormPanelSurface } from '@/theme/styles';

const PANEL_MAX_WIDTH = 420;

type Props = {
  children: ReactNode;
  /** Extra inner padding — used on auth method picker card. */
  spacious?: boolean;
  /** When true, parent column handles vertical centering (auth login/signup). */
  embedded?: boolean;
};

/** Centered frosted glass card for onboarding forms. */
export function OnboardingFormPanel({ children, spacious = false, embedded = false }: Props) {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const surface = onboardingFormPanelSurface(colors, isDark, spacious);
  const useNativeBlur = !isWeb && !spacious && Platform.OS !== 'android';
  const isDesktopWeb = isWeb && width >= 1024;
  const panelMaxWidth = isDesktopWeb ? (spacious ? 640 : 560) : PANEL_MAX_WIDTH;

  return (
    <View style={[styles.centerWrap, embedded && styles.centerWrapEmbedded, webFullWidthStyle]}>
      <View
        style={[
          styles.shell,
          { borderColor: surface.borderColor, maxWidth: panelMaxWidth },
          webFullWidthStyle,
        ]}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.backdropLayer, surface, isWeb ? styles.webBackdrop : null]}
        >
          {useNativeBlur ? (
            <BlurView
              intensity={isDark ? 55 : 75}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
        </View>
        <View
          style={[
            styles.content,
            spacious && styles.contentSpacious,
            styles.contentLayer,
            spacious && !isWeb && styles.contentNativeAuth,
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  centerWrapEmbedded: {
    flexGrow: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  shell: {
    width: '100%',
    maxWidth: PANEL_MAX_WIDTH,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'center',
    position: 'relative',
  },
  backdropLayer: {
    zIndex: 0,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },
  webBackdrop: {
    backdropFilter: 'blur(24px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
  } as object,
  content: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  contentSpacious: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
  contentNativeAuth: {
    backgroundColor: 'rgba(8, 10, 18, 0.78)',
  },
});
