import { Text, View } from 'react-native';

import type { OwnerMemberCandidate } from '@/api/member-requests.api';
import { GymLogo } from '@/components/gym/GymLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';

type Props = {
  candidate: OwnerMemberCandidate;
  onAdd: (memberId: string) => void;
};

export function OwnerCandidateCard({ candidate, onAdd }: Props) {
  const name = candidate.full_name?.trim() || candidate.phone || 'User';
  const disabled = candidate.is_member || candidate.request_status === 'pending';
  const buttonTitle = candidate.is_member ? 'Already Member' : candidate.request_status === 'pending' ? 'Pending' : 'Add';

  return (
    <Card>
      <View className="flex-row items-start justify-between">
        <View className="flex-row gap-3">
          <GymLogo logoUrl={candidate.avatar_url} gymName={name} size="sm" />
          <View>
            <Text className={text.listTitle}>{name}</Text>
            <Text className={text.caption}>{candidate.phone ?? 'No phone'}</Text>
            <Text className={text.caption}>Account: {candidate.account_type}</Text>
          </View>
        </View>
        <Button title={buttonTitle} onPress={() => onAdd(candidate.profile_id)} disabled={disabled} />
      </View>
    </Card>
  );
}
