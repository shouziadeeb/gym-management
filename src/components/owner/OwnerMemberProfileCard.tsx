import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import type { OwnerMemberCard } from '@/api/owner-members.api';
import { MembershipStatusBadge } from '@/components/MembershipStatusBadge';
import { GymLogo } from '@/components/gym/GymLogo';
import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';
import { getMembershipCountdownLabel } from '@/domain/memberships';

type Props = {
  member: OwnerMemberCard;
  action?: ReactNode;
};

export function OwnerMemberProfileCard({ member, action }: Props) {
  const status = member.membership_status ?? 'active';
  const expiryDate = member.expiry_date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const displayName = member.member_name?.trim() || 'Member';
  const days = typeof member.remaining_days === 'number' ? member.remaining_days : 30;

  return (
    <Card>
      <View className="flex-row items-start justify-between">
        <View className="flex-row gap-3">
          <GymLogo logoUrl={member.avatar_url} gymName={displayName} size="sm" />
          <View className="flex-1">
            <Text className={text.listTitle}>{displayName}</Text>
            <Text className={text.caption}>{member.member_phone ?? 'No phone'}</Text>
            <Text className={text.caption}>Joined: {new Date(member.joined_at).toLocaleDateString()}</Text>
            <View className="mt-2">
              <MembershipStatusBadge status={status} expiryDate={expiryDate} />
            </View>
            <Text className={`${text.caption} mt-1`}>Expiry: {member.expiry_date ?? 'Not set'}</Text>
            <Text className={`${text.caption} mt-1`}>{getMembershipCountdownLabel(days)}</Text>
          </View>
        </View>
        <View>{action}</View>
      </View>
    </Card>
  );
}
