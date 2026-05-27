import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import {
  AttendanceConfirmModal,
  AttendanceQRCard,
  AttendanceQrOptionsSheet,
  useAttendanceDashboard,
  useOwnerAttendanceMutations,
  type QrOptionKey,
} from '@/features/attendance';
import { DATE_FORMAT } from '@/constants/date';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/hooks/useTheme';
import { isAttendanceMigrationMissingError } from '@/utils/supabase-errors';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type ConfirmKind = 'generate' | 'enable' | QrOptionKey;

const CONFIRM_COPY: Record<
  ConfirmKind,
  { title: string; message: string; confirmLabel: string; destructive?: boolean }
> = {
  generate: {
    title: 'Generate attendance QR?',
    message: 'A secure QR code will be created for member check-ins at your gym.',
    confirmLabel: 'Generate',
  },
  enable: {
    title: 'Enable attendance?',
    message: 'Members will be able to scan your QR code and check in again.',
    confirmLabel: 'Enable',
  },
  regenerate: {
    title: 'Regenerate QR?',
    message: 'The current QR stops working immediately. Print or display the new code at your gym.',
    confirmLabel: 'Regenerate',
    destructive: true,
  },
  disable: {
    title: 'Disable attendance?',
    message: 'Scanning will be blocked until you enable attendance again.',
    confirmLabel: 'Disable',
    destructive: true,
  },
  delete: {
    title: 'Delete QR?',
    message: 'Members cannot check in until you generate a new QR code.',
    confirmLabel: 'Delete',
    destructive: true,
  },
};

export function OwnerAttendanceQrScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const dashboard = useAttendanceDashboard(activeOwnerGymId ?? undefined);
  const mutations = useOwnerAttendanceMutations(activeOwnerGymId ?? undefined);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const busy =
    mutations.generate.isPending || mutations.toggleEnabled.isPending || mutations.removeQr.isPending;

  const qrLabel = useMemo(() => {
    if (!dashboard.settings?.qr_generated_at) return undefined;
    return format(new Date(dashboard.settings.qr_generated_at), DATE_FORMAT.long);
  }, [dashboard.settings?.qr_generated_at]);

  async function runConfirmed(kind: ConfirmKind) {
    setFeedback(null);
    try {
      if (kind === 'generate') await mutations.generate.mutateAsync(false);
      if (kind === 'enable') await mutations.toggleEnabled.mutateAsync(true);
      if (kind === 'regenerate') await mutations.generate.mutateAsync(true);
      if (kind === 'disable') await mutations.toggleEnabled.mutateAsync(false);
      if (kind === 'delete') await mutations.removeQr.mutateAsync();
      setConfirmKind(null);
      setFeedback('Changes saved successfully.');
    } catch (error) {
      setConfirmKind(null);
      setFeedback(getErrorMessage(error));
    }
  }

  function handleOptionSelect(key: QrOptionKey) {
    setOptionsOpen(false);
    setConfirmKind(key);
  }

  if (!activeOwnerGymId) {
    return (
      <Screen omitTopSafeArea>
        <EmptyState title="Select a gym" description="Choose an active gym to manage attendance QR." />
      </Screen>
    );
  }

  if (isAttendanceMigrationMissingError(dashboard.settingsQuery.error)) {
    return (
      <Screen scroll omitTopSafeArea>
        <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>QR management</Text>
        <Text className={text.body}>Attendance database setup is required before managing QR codes.</Text>
      </Screen>
    );
  }

  const confirmCopy = confirmKind ? CONFIRM_COPY[confirmKind] : null;

  return (
    <Screen scroll omitTopSafeArea>
      <View className={layout.screenTop}>
        <View className={layout.rowBetween}>
          <View className={layout.flex1}>
            <Text className={text.screenTitleLg}>QR management</Text>
            <Text className={`${layout.stackSm} ${text.caption}`}>Display this code at your gym entrance.</Text>
          </View>
          {dashboard.hasQr ? (
            <Pressable
              onPress={() => setOptionsOpen(true)}
              hitSlop={12}
              className="rounded-2xl border p-2.5"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              accessibilityRole="button"
              accessibilityLabel="QR options"
            >
              <MoreHorizontal size={20} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {feedback ? (
        <Text className={`${layout.stack} ${text.bodySm}`} style={{ color: colors.primary }}>
          {feedback}
        </Text>
      ) : null}

      {dashboard.settingsQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.primary} />
          <Text className={`${layout.stackSm} ${text.caption}`}>Loading QR settings…</Text>
        </View>
      ) : null}

      {dashboard.token && dashboard.enabled ? (
        <AttendanceQRCard
          token={dashboard.token}
          label={qrLabel ? `Created ${qrLabel}` : undefined}
          generatedLabel={qrLabel ? `Updated ${qrLabel}` : undefined}
          enabled
        />
      ) : dashboard.token ? (
        <View style={{ gap: spacing[3] }}>
          <AttendanceQRCard token={dashboard.token} label={qrLabel ? `Created ${qrLabel}` : undefined} enabled={false} />
          <Button title="Enable attendance" disabled={busy} onPress={() => setConfirmKind('enable')} />
        </View>
      ) : (
        <View
          className="rounded-3xl border p-5"
          style={{ borderColor: colors.border, backgroundColor: colors.card, gap: spacing[3] }}
        >
          <Text className={text.listTitle}>No QR yet</Text>
          <Text className={text.bodySm}>
            Generate a secure code so members can check in from the scanner in their membership tab.
          </Text>
          <Button title="Generate attendance QR" disabled={busy} onPress={() => setConfirmKind('generate')} />
        </View>
      )}

      {dashboard.token ? (
        <View className="mt-4 flex-row flex-wrap" style={{ gap: spacing[2] }}>
          <View
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: `${dashboard.enabled ? colors.success : colors.muted}22` }}
          >
            <Text className="text-xs font-medium" style={{ color: dashboard.enabled ? colors.success : colors.muted }}>
              {dashboard.enabled ? 'Scanning enabled' : 'Scanning paused'}
            </Text>
          </View>
          {qrLabel ? (
            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-xs font-medium" style={{ color: colors.foregroundSecondary }}>
                {qrLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <AttendanceQrOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onSelect={handleOptionSelect}
      />

      {confirmCopy && confirmKind ? (
        <AttendanceConfirmModal
          visible
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          loading={busy}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => void runConfirmed(confirmKind)}
        />
      ) : null}
    </Screen>
  );
}
