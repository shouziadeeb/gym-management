import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { createGymJoinRequest, mapJoinRequestError } from '@/api/join.api';
import { useGymJoinStatus } from '@/hooks/useGymJoinStatus';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/auth.store';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Props = {
  gymId: string;
  gymName: string;
  /** Hide when the signed-in user owns this gym. */
  hidden?: boolean;
};

export function GymConnectButton({ gymId, gymName, hidden = false }: Props) {
  const { colors } = useTheme();
  const session = useAuthStore((state) => state.session);
  const { isMember, joinRequestStatus, loading, invalidate } = useGymJoinStatus(gymId);
  const [submitting, setSubmitting] = useState(false);

  if (hidden) return null;

  const pending = joinRequestStatus === 'pending';
  const disabled = loading || submitting || isMember || pending;

  const label = loading
    ? 'Loading…'
    : isMember
      ? 'Member'
      : pending
        ? 'Request sent'
        : submitting
          ? 'Sending…'
          : 'Connect';

  const faceStyle = isMember || pending
    ? {
        backgroundColor: colors.chipInactive,
        borderColor: colors.border,
      }
    : {
        backgroundColor: colors.background,
        borderColor: colors.primary,
      };

  const textColor = isMember || pending ? colors.foreground : colors.primary;

  async function handlePress() {
    if (disabled) return;

    if (!session) {
      router.push({
        pathname: '/auth/login',
        params: {
          redirect: `/gym/${encodeURIComponent(gymId)}`,
          intent: 'join_gym',
        },
      } as never);
      return;
    }

    setSubmitting(true);
    const result = await createGymJoinRequest(gymId, 'app');
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Could not connect', mapJoinRequestError(result.error));
      return;
    }

    invalidate();

    if (result.status === 'active') {
      Alert.alert('Welcome!', `You have joined ${gymName}.`);
      return;
    }

    Alert.alert('Request sent', `The owner of ${gymName} will review your request soon.`);
  }

  return (
    <Pressable
      onPress={() => void handlePress()}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={pending ? 'Join request pending' : 'Request to connect with gym'}
      style={({ pressed }) => [styles.fullWidth, pressed && styles.pressed]}
    >
      <View style={[styles.face, faceStyle, disabled && styles.disabled]}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    flex: 1,
  },
  face: {
    minHeight: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
});
