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
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { toE164 } from '@/utils/slug';

const phoneSchema = z.object({
  phone: z.string().min(8, 'Phone required'),
});

type PhoneForm = z.infer<typeof phoneSchema>;

export function MembersScreen() {
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
        <Text className="pt-8 text-slate-600 dark:text-slate-400">No gym selected.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className="pt-6 text-2xl font-bold text-slate-900 dark:text-white">Members</Text>
      <Text className="text-slate-600 dark:text-slate-400">Invite by phone (user must sign up first)</Text>

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
        {feedback ? <Text className="mt-3 text-sm text-slate-700 dark:text-slate-300">{feedback}</Text> : null}
      </Card>

      <Text className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Directory</Text>
      {membersQuery.isLoading ? <Text className="text-slate-500">Loading…</Text> : null}

      {sortedRows.map((row) => (
        <Card key={row.membership.id} className="!mb-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                {row.profile?.full_name || 'Member'}
              </Text>
              <Text className="text-slate-600 dark:text-slate-400">{row.profile?.phone}</Text>

              {row.subscription ? (
                <View className="mt-2">
                  <MembershipStatusBadge status={row.subscription.status} endsAt={row.subscription.ends_at} />
                  <Text className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Renews {format(parseISO(row.subscription.ends_at), DATE_FORMAT.short)}
                  </Text>
                </View>
              ) : (
                <Text className="mt-2 text-amber-700 dark:text-amber-300">No subscription row yet</Text>
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
        <View className="flex-1 items-center justify-center bg-black/50 px-4">
          <View className="w-full max-w-sm rounded-2xl bg-white p-4 dark:bg-slate-900">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">Record payment</Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400">Amount (USD)</Text>

            <TextInput
              className="mt-2 rounded-xl border border-slate-200 px-3 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button title="Cancel" variant="ghost" onPress={() => setPayTarget(null)} />
              </View>
              <View className="flex-1">
                <Button title="Save" onPress={submitPayment} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}