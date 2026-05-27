import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useScreenScrollBottomPadding } from '@/components/ui/Screen';
import {
  AttendanceConfirmModal,
  AttendanceDateFilter,
  AttendanceEmptyState,
  AttendanceGroupedHistoryList,
  AttendanceHistoryStatsBar,
  AttendanceSearchBar,
  useAttendanceHistoryFilters,
  useAttendanceHistorySearch,
  useOwnerAttendanceHistoryManager,
  useOwnerAttendanceMutations,
} from '@/features/attendance';
import type { OwnerAttendanceRow } from '@/features/attendance/types';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export function OwnerAttendanceHistoryScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const bottomPadding = useScreenScrollBottomPadding(true);

  const search = useAttendanceHistorySearch();
  const filters = useAttendanceHistoryFilters();
  const [deleteTarget, setDeleteTarget] = useState<OwnerAttendanceRow | null>(null);

  const queryFilters = useMemo(
    () => ({
      from: filters.range.from,
      to: filters.range.to,
      search: search.debouncedSearch.trim() || undefined,
      sort: filters.sort,
    }),
    [filters.range.from, filters.range.to, filters.sort, search.debouncedSearch],
  );

  const history = useOwnerAttendanceHistoryManager(activeOwnerGymId ?? undefined, queryFilters);
  const mutations = useOwnerAttendanceMutations(activeOwnerGymId ?? undefined);

  const header = (
    <View style={{ gap: spacing[3], paddingTop: spacing[4] }}>
      <View>
        <Text className={text.screenTitleLg}>Attendance history</Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>Filter by date, search members, and review check-ins.</Text>
      </View>

      {history.isLoading ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading attendance analytics" />
      ) : history.isError ? (
        <View
          className="rounded-2xl border p-4"
          style={{ borderColor: colors.border, backgroundColor: colors.surface, gap: spacing[2] }}
        >
          <Text className={text.body}>Could not load attendance history.</Text>
          <Text className={text.caption}>Pull to refresh or tap retry. If this keeps happening, apply the latest Supabase migrations.</Text>
          <Button title="Retry" variant="ghost" onPress={() => void history.refetch()} />
        </View>
      ) : (
        <AttendanceHistoryStatsBar analytics={history.analytics} />
      )}

      <AttendanceSearchBar
        value={search.search}
        onChangeText={search.setSearch}
        onClear={search.clearSearch}
      />

      <AttendanceDateFilter
        preset={filters.preset}
        sort={filters.sort}
        customDate={filters.customDate}
        hasActiveFilters={filters.hasActiveFilters || search.search.length > 0}
        onPresetChange={filters.setPreset}
        onSortChange={filters.setSort}
        onCustomDateChange={filters.setCustomDate}
        onClear={() => {
          filters.clearFilters();
          search.clearSearch();
        }}
      />

      <Text className={`${text.caption} text-xs`} style={{ color: colors.muted }}>
        {history.isError ? 'Unable to load records' : `${history.total} record${history.total === 1 ? '' : 's'} found`}
      </Text>
    </View>
  );

  if (!activeOwnerGymId) {
    return (
      <View className="flex-1 px-4" style={{ paddingTop: spacing[4] }}>
        <EmptyState title="Select a gym" description="Choose an active gym to view attendance history." />
      </View>
    );
  }

  const emptyTitle = search.search.trim() ? 'No matching members' : 'No attendance records';
  const emptyDescription = search.search.trim()
    ? 'Try a different name or phone number.'
    : filters.hasActiveFilters
      ? 'No check-ins for this date range.'
      : 'Records will appear here after members scan your gym QR.';

  return (
    <>
      <AttendanceGroupedHistoryList
        sections={history.sections}
        onRowMorePress={setDeleteTarget}
        ListHeaderComponent={header}
        ListEmptyComponent={
          history.isLoading ? (
            <Text className={text.loading}>Loading history…</Text>
          ) : history.isError ? (
            <AttendanceEmptyState
              compact
              title="History unavailable"
              description="We could not fetch attendance records. Try again after refreshing."
            />
          ) : (
            <AttendanceEmptyState compact title={emptyTitle} description={emptyDescription} />
          )
        }
        ListFooterComponent={
          history.hasMore ? (
            <View className="mt-3">
              <Button
                title="Load more"
                variant="ghost"
                onPress={history.loadMore}
                loading={history.query.isFetchingNextPage}
              />
            </View>
          ) : null
        }
        refreshing={history.isRefetching}
        onRefresh={() => void history.refetch()}
        onEndReached={() => {
          if (history.hasMore && !history.query.isFetchingNextPage) history.loadMore();
        }}
        contentPaddingBottom={bottomPadding + spacing[8]}
      />

      {deleteTarget ? (
        <AttendanceConfirmModal
          visible
          title="Delete attendance record?"
          message={`Remove check-in for ${deleteTarget.member_name ?? 'this member'}? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          loading={mutations.removeRecord.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await mutations.removeRecord.mutateAsync(deleteTarget.id);
              setDeleteTarget(null);
            } catch (error) {
              setDeleteTarget(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
