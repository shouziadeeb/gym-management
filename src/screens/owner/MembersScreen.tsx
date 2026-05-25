import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { z } from 'zod';

import { addMemberByPhone, fetchGymMemberRows, removeMemberFromGym } from '@/api/members.api';
import { recordManualPayment } from '@/api/payments.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { MembershipStatusBadge } from '@/components/MembershipStatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { DATE_FORMAT } from '@/constants/date';
import { getErrorMessage } from '@/lib/errors';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { toE164 } from '@/utils/phone';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface, inputSurface, modalOverlay } from '@/theme/styles';

const phoneSchema = z.object({
  phone: z.string().min(8, 'Phone required'),
});

type PhoneForm = z.infer<typeof phoneSchema>;

export function MembersScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const ownerId = useAuthStore((state) => state.session?.user.id);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [months, setMonths] = useState('1');
  const [payTarget, setPayTarget] = useState<{ userId: string; membershipId: string | null } | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const membersQuery = useQuery({
    queryKey: queryKeys.members.list(activeOwnerGymId ?? undefined),
    queryFn: () => fetchGymMemberRows(activeOwnerGymId!),
    enabled: !!activeOwnerGymId,
  });

  const form = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const rows = membersQuery.data ?? [];

  const sortedRows = useMemo(
    () =>
      [...rows].sort((left, right) =>
        (left.profile?.full_name ?? left.profile?.phone ?? '').localeCompare(
          right.profile?.full_name ?? right.profile?.phone ?? '',
        ),
      ),
    [rows],
  );

  const submit = form.handleSubmit(async (values) => {
    if (!activeOwnerGymId || !ownerId) return;

    setFeedback(null);

    try {
      const normalizedPhone = toE164(values.phone);
      const parsedMonths = parseInt(months, 10);

      if (!Number.isFinite(parsedMonths) || parsedMonths < 1 || parsedMonths > 24) {
        setFeedback('Months must be between 1 and 24.');
        return;
      }

      await addMemberByPhone(activeOwnerGymId, ownerId, normalizedPhone, parsedMonths);
      form.reset({ phone: '' });
      setMonths('1');

      await queryClient.invalidateQueries({ queryKey: queryKeys.members.list(activeOwnerGymId) });
      setFeedback('Member added and membership started.');
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  });

  async function submitPayment() {
    if (!activeOwnerGymId || !payTarget) return;

    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number.');
      return;
    }

    try {
      await recordManualPayment({
        gymId: activeOwnerGymId,
        userId: payTarget.userId,
        membershipId: payTarget.membershipId,
        amountCents: Math.round(amount * 100),
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.payments.list(activeOwnerGymId) });
      setPayTarget(null);
      setPayAmount('');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  if (!activeOwnerGymId) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>No gym selected.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Members</Text>
      <Text className={text.caption}>Invite by phone (user must sign up first)</Text>

      <Card title="Add member">
        <Controller
          control={form.control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Member phone (E.164)"
              placeholder="+15551234567"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Input
          label="Initial term (months)"
          placeholder="1"
          keyboardType="phone-pad"
          value={months}
          onChangeText={setMonths}
        />

        <Button title="Add to gym" onPress={submit} loading={form.formState.isSubmitting} />
        {feedback ? <Text className={`${layout.stackMd} ${text.bodySm}`}>{feedback}</Text> : null}
      </Card>

      <Text className={`mb-2 ${text.listTitle}`}>Directory</Text>
      {membersQuery.isLoading ? <Text className={text.loading}>Loading…</Text> : null}

      {sortedRows.map((row) => (
        <Card key={row.membership.id} className="!mb-3">
          <View className={layout.rowBetween}>
            <View className={`${layout.flex1} pr-2`}>
              <Text className={text.listTitle}>{row.profile?.full_name || 'Member'}</Text>
              <Text className={text.caption}>{row.profile?.phone}</Text>

              {row.subscription ? (
                <View className={layout.stack}>
                  <MembershipStatusBadge status={row.subscription.status} endsAt={row.subscription.ends_at} />
                  <Text className={`${layout.stack} ${text.caption}`}>
                    Renews {format(parseISO(row.subscription.ends_at), DATE_FORMAT.short)}
                  </Text>
                </View>
              ) : (
                <Text className={`${layout.stack} ${text.warningBody}`}>No subscription row yet</Text>
              )}
            </View>

            <View className="gap-2">
              <Button
                title="Pay"
                variant="ghost"
                onPress={() => {
                  if (!row.profile?.id) return;
                  setPayAmount('49');
                  setPayTarget({ userId: row.profile.id, membershipId: row.subscription?.id ?? null });
                }}
              />

              <Button
                title="Remove"
                variant="danger"
                onPress={() =>
                  Alert.alert('Remove member?', 'They can rejoin if you add them again.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: async () => {
                        if (!row.profile?.id) return;
                        await removeMemberFromGym(activeOwnerGymId, row.profile.id);
                        await queryClient.invalidateQueries({
                          queryKey: queryKeys.members.list(activeOwnerGymId),
                        });
                      },
                    },
                  ])
                }
              />
            </View>
          </View>
        </Card>
      ))}

      <Modal visible={!!payTarget} transparent animationType="fade">
        <View className={surfaces.modalOverlay} style={modalOverlay(colors)}>
          <View className={surfaces.modalPanel} style={cardSurface(colors, true)}>
            <Text className={text.cardTitle} style={{ color: colors.foreground }}>
              Record payment
            </Text>
            <Text className={`${layout.stackSm} ${text.caption}`}>Amount (USD)</Text>

            <TextInput
              className={`${layout.stack} ${surfaces.inputCompact}`}
              style={inputSurface(colors)}
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
              placeholderTextColor={colors.placeholder}
            />

            <View className={`${layout.stackLg} ${layout.row}`}>
              <View className={layout.flex1}>
                <Button title="Cancel" variant="ghost" onPress={() => setPayTarget(null)} />
              </View>
              <View className={layout.flex1}>
                <Button title="Save" onPress={submitPayment} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
