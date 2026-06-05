import { Dumbbell } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/app';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type AuthBrandHeaderProps = {
  title: string;
};

/** Centered app mark + title above the auth form card. */
export function AuthBrandHeader({ title }: AuthBrandHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconShell, { backgroundColor: 'rgba(0, 0, 0, 0.45)', borderColor: colors.border }]}>
        <Dumbbell size={22} color={colors.foreground} strokeWidth={2.25} />
      </View>
      <Text style={[styles.appName, { color: colors.foreground }]}>{APP_NAME}</Text>
      <Text style={[styles.title, { color: colors.foregroundSecondary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  iconShell: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  title: {
    marginTop: spacing[1],
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
