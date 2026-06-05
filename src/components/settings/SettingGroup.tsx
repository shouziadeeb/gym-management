import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { cardSurface } from '@/theme/styles';
import { webFullWidthStyle } from '@/lib/web-layout';

type SettingGroupProps = {
  children: ReactNode;
};

/** Rounded card container for a list of {@link SettingItem} rows. */
export function SettingGroup({ children }: SettingGroupProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shell, cardSurface(colors), webFullWidthStyle]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
});
