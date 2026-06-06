import { Text, View } from 'react-native';

import type { OwnerPendingInvite } from '@/api/member-requests.api';
import { GymLogo } from '@/components/gym/GymLogo';
import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  invite: OwnerPendingInvite;
};

export function OwnerPendingInviteCard({ invite }: Props) {
  const label = invite.member_name?.trim() || invite.member_phone || 'Member';

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <GymLogo gymName={label} size="sm" />
        <View className="flex-1">
          <Text className={text.listTitle}>{label}</Text>
          {invite.member_phone ? <Text className={text.caption}>{invite.member_phone}</Text> : null}
          <Text className={text.caption}>Plan: {invite.plan_type}</Text>
          <Text className={text.caption}>Sent: {new Date(invite.created_at).toLocaleString()}</Text>
          <Text className={text.caption} style={{ marginTop: spacing[1] }}>
            Awaiting member response
          </Text>
        </View>
      </View>
    </Card>
  );
}
