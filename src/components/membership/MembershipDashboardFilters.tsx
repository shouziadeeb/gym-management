import { View } from 'react-native';

import { MEMBERSHIP_FILTER_OPTIONS, MEMBERSHIP_SORT_OPTIONS, type MembershipDashboardFilter, type MembershipDashboardSort } from '@/domain/memberships';
import { Chip } from '@/components/ui/Chip';

type Props = {
  filter: MembershipDashboardFilter;
  onFilterChange: (next: MembershipDashboardFilter) => void;
  sortBy: MembershipDashboardSort;
  onSortByChange: (next: MembershipDashboardSort) => void;
};

export function MembershipDashboardFilters({ filter, onFilterChange, sortBy, onSortByChange }: Props) {
  return (
    <View>
      <View className="mb-2 flex-row flex-wrap gap-2">
        {MEMBERSHIP_FILTER_OPTIONS.map((option) => (
          <Chip key={option.id} label={option.label} active={filter === option.id} onPress={() => onFilterChange(option.id)} />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {MEMBERSHIP_SORT_OPTIONS.map((option) => (
          <Chip key={option.id} label={option.label} active={sortBy === option.id} onPress={() => onSortByChange(option.id)} />
        ))}
      </View>
    </View>
  );
}
