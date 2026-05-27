import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { onboardingFlowBackgroundImage } from '@/constants/assets';
import { useFullBleedBackgroundFrame } from '@/hooks/useFullBleedBackgroundFrame';
import { isWeb, webFullWidthStyle, webImageCoverStyle } from '@/lib/web-layout';
import { palette } from '@/theme/colors';

type Props = {
  children: ReactNode;
};

/** Full-bleed gym photo with blurred blue tint for auth + profile onboarding. */
export function OnboardingFlowBackground({ children }: Props) {
  const backgroundFrame = useFullBleedBackgroundFrame();

  return (
    <View style={[styles.root, isWeb ? styles.rootWeb : null, webFullWidthStyle]}>
      <View style={[backgroundFrame, styles.backgroundClip]} pointerEvents="none">
        <Image
          source={onboardingFlowBackgroundImage}
          style={[styles.backgroundImage, webImageCoverStyle]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />

        {isWeb ? (
          <View style={[StyleSheet.absoluteFillObject, styles.webBlurFallback]} />
        ) : (
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
        )}

        <View style={[StyleSheet.absoluteFillObject, styles.blueTint]} />

        <LinearGradient
          colors={[
            'rgba(13, 13, 13, 0.08)',
            'rgba(3, 4, 94, 0.28)',
            'rgba(13, 13, 13, 0.55)',
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.slate950,
  },
  rootWeb: {
    minHeight: '100%',
    width: '100%',
    position: 'relative',
  },
  backgroundClip: {
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  webBlurFallback: {
    backgroundColor: 'rgba(13, 13, 13, 0.32)',
  },
  blueTint: {
    backgroundColor: 'rgba(67, 97, 238, 0.26)',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
