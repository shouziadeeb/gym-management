import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { isWeb, webFullWidthStyle } from '@/lib/web-layout';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { onboardingFormPanelSurface } from '@/theme/styles';

const PANEL_MAX_WIDTH = 420;

type Props = {
  children: ReactNode;
};

/** Centered frosted glass card for onboarding forms. */
export function OnboardingFormPanel({ children }: Props) {
  const { colors, isDark } = useTheme();
  const surface = onboardingFormPanelSurface(colors, isDark);

  return (
    <View style={[styles.centerWrap, webFullWidthStyle]}>
      <View style={[styles.shell, { borderColor: surface.borderColor }, webFullWidthStyle]}>
        {!isWeb ? (
          <BlurView
            intensity={isDark ? 55 : 75}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View style={[StyleSheet.absoluteFillObject, surface, isWeb ? styles.webBackdrop : null]} />
        <View style={styles.content}>{children}</View>
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
    paddingHorizontal: spacing[2],
  },
  shell: {
    width: '100%',
    maxWidth: PANEL_MAX_WIDTH,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'center',
  },
  webBackdrop: {
    backdropFilter: 'blur(24px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
  } as object,
  content: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
});
