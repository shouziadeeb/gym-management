import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type SettingSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Section header + grouped settings card. */
export function SettingSection({ title, description, children }: SettingSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.foregroundSecondary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing[5],
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
});
