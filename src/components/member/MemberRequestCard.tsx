import { Text, View } from 'react-native';

import type { MemberIncomingRequest } from '@/api/member-requests.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';

type Props = {
  request: MemberIncomingRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  busy?: boolean;
};

export function MemberRequestCard({ request, onAccept, onReject, busy }: Props) {
  return (
    <Card title={request.gym_name ?? 'Gym invitation'}>
      <Text className={text.bodySm}>
        {request.owner_name ?? 'A gym owner'} has invited you to join this gym.
      </Text>
      <Text className={text.caption}>Owner: {request.owner_name ?? 'Gym Owner'}</Text>
      {request.owner_phone ? <Text className={text.caption}>Owner phone: {request.owner_phone}</Text> : null}
      <Text className={text.caption}>Requested: {new Date(request.created_at).toLocaleString()}</Text>
      <View className="mt-3 flex-row gap-2">
        <View className="flex-1">
          <Button title="Accept" onPress={() => onAccept(request.id)} loading={busy} />
        </View>
        <View className="flex-1">
          <Button title="Reject" variant="ghost" onPress={() => onReject(request.id)} disabled={busy} />
        </View>
      </View>
    </Card>
  );
}
