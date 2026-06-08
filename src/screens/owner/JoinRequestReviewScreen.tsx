import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchGymJoinRequestForOwner, ownerRespondJoinRequest } from '@/api/join.api';
import { queryKeys } from '@/api/queries/keys';
import { GymLogo } from '@/components/gym/GymLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export function JoinRequestReviewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = typeof id === 'string' ? id : '';
  const queryClient = useQueryClient();
  const [responding, setResponding] = useState<'approve' | 'reject' | null>(null);

  const requestQuery = useQuery({
    queryKey: queryKeys.join.request(requestId),
    queryFn: () => fetchGymJoinRequestForOwner(requestId),
    enabled: Boolean(requestId),
  });

  const request = requestQuery.data;

  async function handleDecision(decision: 'approve' | 'reject') {
    if (!requestId || !request) return;

    setResponding(decision);
    const result = await ownerRespondJoinRequest(requestId, decision);
    setResponding(null);

    if (!result.ok) {
      Alert.alert('Could not update request', result.error);
      return;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.join.request(requestId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.members.list(request.gymId) });

    Alert.alert(
      decision === 'approve' ? 'Member added' : 'Request rejected',
      decision === 'approve'
        ? `${request.requester.fullName ?? 'The member'} is now part of ${request.gymName}.`
        : 'The join request was declined.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  if (!requestId) {
    return (
      <Screen>
        <EmptyState title="Invalid request" description="This link is missing a request id." />
      </Screen>
    );
  }

  if (requestQuery.isLoading) {
    return <LoadingScreen label="Loading request…" />;
  }

  if (requestQuery.error || !request) {
    return (
      <Screen>
        <EmptyState
          title="Request not found"
          description="It may have been removed or you do not have access."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const requesterLabel = request.requester.fullName?.trim() || 'Member';
  const isPending = request.status === 'pending';

  return (
    <Screen scroll>
      <View className={layout.screenTop}>
        <Text className={text.screenTitle}>Join request</Text>
        <Text className={`${layout.stack} ${text.caption}`}>{request.gymName}</Text>
      </View>

      <Card title="Requester">
        <View className="flex-row items-start gap-3">
          <GymLogo gymName={requesterLabel} size="md" logoUrl={request.requester.avatarUrl} />
          <View className="flex-1">
            <Text className={text.listTitle}>{requesterLabel}</Text>
            {request.requester.phone ? (
              <Text className={`${layout.stackSm} ${text.bodySm}`}>Phone: {request.requester.phone}</Text>
            ) : null}
            {request.requester.email ? (
              <Text className={`${layout.stackSm} ${text.bodySm}`}>Email: {request.requester.email}</Text>
            ) : null}
            {request.requester.accountType ? (
              <Text className={`${layout.stackSm} ${text.caption}`}>
                Account: {request.requester.accountType}
              </Text>
            ) : null}
            <Text className={`${layout.stackSm} ${text.caption}`}>
              Requested: {new Date(request.createdAt).toLocaleString()}
            </Text>
            <Text className={`${layout.stackSm} ${text.caption}`}>Source: {request.source}</Text>
            {!isPending ? (
              <Text className={`${layout.stackSm} ${text.caption}`} style={{ marginTop: spacing[1] }}>
                Status: {request.status}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      {isPending ? (
        <View className={`${layout.row} ${layout.stackMd}`}>
          <View style={{ flex: 1 }}>
            <Button
              title={responding === 'reject' ? 'Rejecting…' : 'Reject'}
              variant="ghost"
              onPress={() => void handleDecision('reject')}
              disabled={responding !== null}
              loading={responding === 'reject'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={responding === 'approve' ? 'Accepting…' : 'Accept'}
              onPress={() => void handleDecision('approve')}
              disabled={responding !== null}
              loading={responding === 'approve'}
            />
          </View>
        </View>
      ) : (
        <View className={layout.stackMd}>
          <Button title="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      )}
    </Screen>
  );
}
