import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import {
  createGymJoinRequest,
  mapJoinContextError,
  mapJoinRequestError,
  resolveGymJoinContext,
  type GymJoinContext,
} from '@/api/join.api';
import { recordDeepLinkEvent } from '@/api/deep-link-events.api';
import { useTheme } from '@/hooks/useTheme';
import { routes } from '@/routing/constants';
import { useAuthStore } from '@/store/auth.store';

export function GymJoinScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);

  const [context, setContext] = useState<GymJoinContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const gymSlug = typeof slug === 'string' ? slug : '';

  useEffect(() => {
    if (!gymSlug) {
      setError('Invalid gym link.');
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      const result = await resolveGymJoinContext(gymSlug);
      if (!result.ok) {
        setError(mapJoinContextError(result.error));
        setContext(null);
      } else {
        setContext(result);
        setError(null);
        void recordDeepLinkEvent({
          eventType: 'qr_scan_join',
          gymId: result.gym_id,
          metadata: { slug: gymSlug },
        });
      }
      setLoading(false);
    })();
  }, [gymSlug]);

  const handleJoin = useCallback(async () => {
    if (!context) return;

    if (!session) {
      router.push({
        pathname: '/auth/login',
        params: {
          redirect: `/join/${encodeURIComponent(gymSlug)}`,
          intent: 'join_gym',
        },
      } as never);
      return;
    }

    if (context.is_member) {
      router.replace(routes.memberships as never);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGymJoinRequest(context.gym_id, 'deep_link');
    setSubmitting(false);

    if (!result.ok) {
      setError(mapJoinRequestError(result.error));
      return;
    }

    void recordDeepLinkEvent({
      eventType: 'join_conversion',
      gymId: context.gym_id,
      metadata: { status: result.status, mode: result.mode },
    });

    if (result.status === 'active') {
      setSuccessMessage('Welcome! You have joined this gym.');
      setTimeout(() => router.replace(routes.memberships as never), 1200);
      return;
    }

    setSuccessMessage('Join request sent. The gym owner will review it soon.');
  }, [context, gymSlug, session]);

  if (!initialized || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !context) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
        <Pressable onPress={() => router.replace(routes.explore as never)}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Browse gyms</Text>
        </Pressable>
      </View>
    );
  }

  if (!context) return null;

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: colors.background, justifyContent: 'center' }}>
      {context.logo_url ? (
        <Image
          source={{ uri: context.logo_url }}
          style={{ width: 72, height: 72, borderRadius: 16, alignSelf: 'center', marginBottom: 16 }}
        />
      ) : null}

      <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
        {context.name}
      </Text>

      {context.address ? (
        <Text style={{ color: colors.foregroundSecondary, textAlign: 'center', marginTop: 8 }}>{context.address}</Text>
      ) : null}

      {context.description ? (
        <Text style={{ color: colors.foreground, textAlign: 'center', marginTop: 16, lineHeight: 22 }}>
          {context.description}
        </Text>
      ) : null}

      {context.is_member ? (
        <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 24, fontWeight: '600' }}>
          You are already a member of this gym.
        </Text>
      ) : null}

      {context.join_request_status === 'pending' ? (
        <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 24 }}>
          Your join request is pending owner approval.
        </Text>
      ) : null}

      {successMessage ? (
        <Text style={{ color: colors.primary, textAlign: 'center', marginTop: 24, fontWeight: '600' }}>
          {successMessage}
        </Text>
      ) : null}

      {error ? (
        <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 16 }}>{error}</Text>
      ) : null}

      {!context.is_member && context.join_request_status !== 'pending' && !successMessage ? (
        <Pressable
          onPress={() => void handleJoin()}
          disabled={submitting}
          style={{
            marginTop: 32,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {session ? 'Request to join' : 'Sign in to join'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
