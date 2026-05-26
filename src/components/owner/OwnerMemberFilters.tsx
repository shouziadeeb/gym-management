import { Text, View } from 'react-native';

import type { OwnerMemberStatusFilter } from '@/api/owner-members.api';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { text } from '@/theme/classes';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  status: OwnerMemberStatusFilter;
  onStatusChange: (next: OwnerMemberStatusFilter) => void;
};

const OPTIONS: Array<{ id: OwnerMemberStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring_soon', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
];

export function OwnerMemberFilters({ search, onSearchChange, status, onStatusChange }: Props) {
  return (
    <View>
      <Input
        label="Search members"
        placeholder="Name or phone"
        value={search}
        onChangeText={onSearchChange}
      />
      <Text className={`mb-2 ${text.label}`}>Membership filter</Text>
      <View className="flex-row flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <Chip key={option.id} label={option.label} active={status === option.id} onPress={() => onStatusChange(option.id)} />
        ))}
      </View>
    </View>
  );
}
