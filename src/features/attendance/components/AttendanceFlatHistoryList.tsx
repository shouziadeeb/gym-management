import { FlatList, View } from 'react-native';
import type { ListRenderItem } from 'react-native';

import { AttendanceHistoryItem } from '@/features/attendance/components/AttendanceHistoryItem';
import type { OwnerAttendanceRow } from '@/features/attendance/types';
import { screenLayout, spacing } from '@/theme/spacing';

type Props = {
  rows: OwnerAttendanceRow[];
  showPhone?: boolean;
  onRowMorePress?: (row: OwnerAttendanceRow) => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<unknown> | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPaddingBottom?: number;
};

export function AttendanceHistoryList({
  rows,
  onRowMorePress,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  refreshing,
  onRefresh,
  contentPaddingBottom = spacing[4],
}: Props) {
  const renderItem: ListRenderItem<OwnerAttendanceRow> = ({ item }) => (
    <AttendanceHistoryItem row={item} onMorePress={onRowMorePress ? () => onRowMorePress(item) : undefined} />
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{
        paddingBottom: contentPaddingBottom,
        paddingHorizontal: screenLayout.screenPaddingX,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

export { AttendanceHistoryItem as OwnerAttendanceRowCard } from '@/features/attendance/components/AttendanceHistoryItem';
export { MemberAttendanceRowCard } from '@/features/attendance/components/MemberAttendanceRowCard';
