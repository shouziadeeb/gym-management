/**
 * @file BecomeGymOwnerCard.tsx
 * Promotional owner card with gradient primary CTA (reference layout, app theme colors).
 */
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type BecomeGymOwnerCardProps = {
  onCreateGym: () => void;
};

export function BecomeGymOwnerCard({ onCreateGym }: BecomeGymOwnerCardProps) {
  const { colors } = useTheme();

  const gradientStart = colors.primary;
  const gradientEnd = colors.accent;

  return (
    <LinearGradient
      colors={[`${gradientStart}33`, `${gradientEnd}18`, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.highlightBorder,
        padding: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
        <Dumbbell size={22} color={colors.primary} strokeWidth={2} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Become Gym Owner</Text>
      </View>

      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: spacing[4] }}>
        If you own a gym or want to manage your fitness business, create your gym and access owner tools.
      </Text>

      <Pressable onPress={onCreateGym} accessibilityRole="button" accessibilityLabel="Create gym">
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            borderRadius: 12,
            paddingVertical: spacing[3.5],
            paddingHorizontal: spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primaryForeground }}>Create Gym</Text>
          <ChevronRight size={20} color={colors.primaryForeground} strokeWidth={2.5} />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}
