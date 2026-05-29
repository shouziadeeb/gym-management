/**
 * @file ProfileGuestCard.tsx
 * Signed-out account card matching the profile hub visual style.
 */
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

export function ProfileGuestCard() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: spacing[1] }}>
        Account
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: spacing[4] }}>
        Sign in to unlock memberships, bookings, and owner tools.
      </Text>

      <Pressable onPress={() => router.push('/auth/login')} style={{ marginBottom: spacing[3] }}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ borderRadius: 12, paddingVertical: spacing[3.5], alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryForeground }}>Login</Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => router.push('/auth/signup')}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingVertical: spacing[3.5],
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Create account</Text>
      </Pressable>
    </View>
  );
}
