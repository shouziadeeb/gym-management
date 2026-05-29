/**
 * @file ProfileHeroSection.tsx
 * Large avatar, status badge, display name, and profile completion line.
 */
import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type ProfileHeroSectionProps = {
  displayName: string;
  avatarInitial: string;
  profileComplete: boolean;
};

export function ProfileHeroSection({
  displayName,
  avatarInitial,
  profileComplete,
}: ProfileHeroSectionProps) {
  const { colors } = useTheme();
  const initial = avatarInitial.trim().charAt(0).toUpperCase() || 'U';

  return (
    <View style={{ alignItems: 'center', marginBottom: spacing[6] }}>
      <View style={{ position: 'relative', marginBottom: spacing[4] }}>
        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 56,
            borderWidth: 2,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 40, fontWeight: '700', color: colors.foreground }}>{initial}</Text>
        </View>

        {profileComplete ? (
          <View
            style={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              backgroundColor: colors.primary,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primaryForeground }}>PRO</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: spacing[2],
        }}
        numberOfLines={2}
      >
        {displayName}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
        {profileComplete ? <Check size={16} color={colors.primary} strokeWidth={2.5} /> : null}
        <Text style={{ fontSize: 14, color: colors.muted }}>
          Profile: {profileComplete ? 'Complete' : 'Incomplete'}
        </Text>
      </View>
    </View>
  );
}
