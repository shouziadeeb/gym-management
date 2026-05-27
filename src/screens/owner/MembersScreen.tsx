import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { z } from 'zod';

import { createMemberRequest } from '@/api/member-requests.api';
import { renewMembershipLifecycle, upsertMembershipLifecycle } from '@/api/membership-lifecycle.api';
import { addMemberByPhone, removeMemberFromGym } from '@/api/members.api';
import { recordManualPayment } from '@/api/payments.api';
import { queryClient } from '@/api/queries/client';
import { queryKeys } from '@/api/queries/keys';
import { OwnerCandidateCard } from '@/components/owner/OwnerCandidateCard';
import { OwnerDashboardStats } from '@/components/owner/OwnerDashboardStats';
import { OwnerMemberFilters } from '@/components/owner/OwnerMemberFilters';
import { OwnerMemberListSkeleton } from '@/components/owner/OwnerMemberListSkeleton';
import { OwnerMemberProfileCard } from '@/components/owner/OwnerMemberProfileCard';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { useOwnerMemberCandidates } from '@/hooks/useOwnerMemberCandidates';
import { useOwnerDashboard } from '@/hooks/useOwnerDashboard';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { toE164 } from '@/utils/phone';
import { layout, surfaces, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';
import { inputSurface } from '@/theme/styles';
import type { MembershipPlanType } from '@/domain/memberships';

const phoneSchema = z.object({
  phone: z.string().min(8, 'Phone required'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
const PLAN_OPTIONS: MembershipPlanType[] = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
const PLAN_LABELS: Record<MembershipPlanType, string> = {
  monthly: 'Monthly (30 days)',
  quarterly: 'Quarterly (90 days)',
  half_yearly: 'Half-yearly (180 days)',
  yearly: 'Yearly (365 days)',
};
const PLAN_MONTHS_BY_TYPE: Record<MembershipPlanType, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

export function MembersScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const ownerId = useAuthStore((state) => state.session?.user.id);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [months, setMonths] = useState('1');
  const [payTarget, setPayTarget] = useState<{ userId: string; membershipId: string | null } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; label: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [renewPlanType, setRenewPlanType] = useState<MembershipPlanType>('monthly');
  const [addPlanType, setAddPlanType] = useState<MembershipPlanType>('monthly');
  const [ownerView, setOwnerView] = useState<'add_member' | 'current_members'>(
    params.view === 'add_member' ? 'add_member' : 'current_members',
  );
  const ownerDashboard = useOwnerDashboard();
  const candidatesQuery = useOwnerMemberCandidates({
    gymId: activeOwnerGymId ?? undefined,
    search: ownerDashboard.search,
    page: ownerDashboard.page,
    pageSize: 20,
  });

  useEffect(() => {
    setOwnerView(params.view === 'add_member' ? 'add_member' : 'current_members');
  }, [params.view]);

  useEffect(() => {
    if (!isFocused || !activeOwnerGymId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.members.ownerSummary(activeOwnerGymId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.members.ownerSearch(
        activeOwnerGymId,
        ownerDashboard.search,
        ownerDashboard.status,
        ownerDashboard.page,
        20,
      ),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.members.ownerCandidates(
        activeOwnerGymId,
        ownerDashboard.search,
        ownerDashboard.page,
        20,
      ),
    });
  }, [isFocused, activeOwnerGymId, ownerDashboard.search, ownerDashboard.status, ownerDashboard.page]);

  const form = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  async function refreshOwnerMembersState() {
    if (!activeOwnerGymId) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(activeOwnerGymId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.members.ownerSummary(activeOwnerGymId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.ownerSearch(
          activeOwnerGymId,
          ownerDashboard.search,
          ownerDashboard.status,
          ownerDashboard.page,
          20,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.ownerCandidates(
          activeOwnerGymId,
          ownerDashboard.search,
          ownerDashboard.page,
          20,
        ),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byGym(activeOwnerGymId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.list(activeOwnerGymId) }),
    ]);
  }

  const submit = form.handleSubmit(async (values) => {
    if (!activeOwnerGymId || !ownerId) return;

    setFeedback(null);

    try {
      const normalizedPhone = toE164(values.phone);
      const parsedMonths = PLAN_MONTHS_BY_TYPE[addPlanType];

      if (!Number.isFinite(parsedMonths) || parsedMonths < 1 || parsedMonths > 24) {
        setFeedback('Months must be between 1 and 24.');
        return;
      }

      await addMemberByPhone(activeOwnerGymId, ownerId, normalizedPhone, parsedMonths);
      form.reset({ phone: '' });
      setMonths(String(parsedMonths));
      await refreshOwnerMembersState();
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

      await refreshOwnerMembersState();
      setPayTarget(null);
      setPayAmount('');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  async function submitRenewal(target: { membershipId: string; memberId: string }) {
    if (!activeOwnerGymId) return;

    try {
      await renewMembershipLifecycle({
        membershipId: target.membershipId,
        gymId: activeOwnerGymId,
        memberId: target.memberId,
        planType: renewPlanType,
        amountCents: Math.max(0, Math.round(Number(payAmount || 0) * 100)),
      });

      await refreshOwnerMembersState();
      Alert.alert('Renewed', 'Membership renewed successfully.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  async function ensureMembershipAndRenew(target: {
    memberId: string;
    membershipId: string | null;
    fallbackPlanType?: MembershipPlanType | null;
  }) {
    if (!activeOwnerGymId) return;

    try {
      if (!target.membershipId) {
        const bootstrapped = await upsertMembershipLifecycle({
          gymId: activeOwnerGymId,
          memberId: target.memberId,
          planType: target.fallbackPlanType ?? renewPlanType,
          paymentStatus: 'paid',
        });
        await submitRenewal({ membershipId: bootstrapped.id, memberId: target.memberId });
        return;
      }

      await submitRenewal({ membershipId: target.membershipId, memberId: target.memberId });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  async function sendJoinRequest(memberId: string) {
    if (!activeOwnerGymId || !ownerId) return;
    try {
      await createMemberRequest({ gymId: activeOwnerGymId, ownerId, memberId, planType: addPlanType });
      await refreshOwnerMembersState();
      Alert.alert('Request sent', 'Membership request has been sent to the user.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  async function confirmRemoveMember() {
    if (!activeOwnerGymId || !removeTarget) return;

    try {
      setIsRemoving(true);
      await removeMemberFromGym(activeOwnerGymId, removeTarget.userId);
      await refreshOwnerMembersState();
      setRemoveTarget(null);
      Alert.alert('Removed', 'Member removed successfully.');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsRemoving(false);
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

      <Card title="Actions">
        <View className={layout.row} style={{ gap: spacing[2] }}>
          <View className={layout.flex1}>
            <Button
              title="Add Member"
              variant={ownerView === 'add_member' ? 'primary' : 'ghost'}
              onPress={() => setOwnerView('add_member')}
            />
          </View>
          <View className={layout.flex1}>
            <Button
              title="Members"
              variant={ownerView === 'current_members' ? 'primary' : 'ghost'}
              onPress={() => setOwnerView('current_members')}
            />
          </View>
        </View>
      </Card>

      {!ownerDashboard.isOwnerAllowed ? (
        <Card title="Access denied">
          <Text className={text.error}>Only gym owners can access member management.</Text>
        </Card>
      ) : null}

      {ownerDashboard.isOwnerAllowed ? (
        <OwnerDashboardStats
          total={ownerDashboard.summary.total_members}
          active={ownerDashboard.summary.active_memberships}
          expiring={ownerDashboard.summary.expiring_memberships}
          expired={ownerDashboard.summary.expired_memberships}
        />
      ) : null}

      {ownerView === 'add_member' ? (
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
            placeholder={String(PLAN_MONTHS_BY_TYPE[addPlanType])}
            keyboardType="number-pad"
            value={String(PLAN_MONTHS_BY_TYPE[addPlanType])}
            onChangeText={() => {}}
          />
          <Text className={`mb-2 ${text.label}`}>Membership plan</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {PLAN_OPTIONS.map((option) => (
              <Button
                key={option}
                title={PLAN_LABELS[option]}
                variant={addPlanType === option ? 'primary' : 'ghost'}
                onPress={() => setAddPlanType(option)}
              />
            ))}
          </View>

          <Button title="Add to gym" onPress={submit} loading={form.formState.isSubmitting} />
          {feedback ? <Text className={`${layout.stackMd} ${text.bodySm}`}>{feedback}</Text> : null}
        </Card>
      ) : null}

      <Text className={`mb-2 ${text.listTitle}`}>{ownerView === 'add_member' ? 'Add Member Requests' : 'Current Members'}</Text>

      <Card title="Search & Filters">
        <OwnerMemberFilters
          search={ownerDashboard.search}
          onSearchChange={ownerDashboard.setSearch}
          status={ownerDashboard.status}
          onStatusChange={ownerDashboard.setStatus}
        />
      </Card>

      {ownerView === 'add_member' ? (
        <>
          {candidatesQuery.isLoading ? <OwnerMemberListSkeleton /> : null}
          {candidatesQuery.error ? (
            <Card>
              <Text className={text.error}>Failed to load users list.</Text>
            </Card>
          ) : null}
          {(candidatesQuery.data?.rows ?? []).map((candidate) => (
            <OwnerCandidateCard key={candidate.profile_id} candidate={candidate} onAdd={sendJoinRequest} />
          ))}
          {!candidatesQuery.isLoading && (candidatesQuery.data?.rows.length ?? 0) === 0 ? (
            <Card title="No users found">
              <Text className={text.caption}>No matching users for the current search.</Text>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          {ownerDashboard.isLoading ? <OwnerMemberListSkeleton /> : null}
          {ownerDashboard.hasError ? (
            <Card>
              <Text className={text.error}>Failed to load members. Please try again.</Text>
            </Card>
          ) : null}

          {ownerDashboard.members.map((member) => (
            <OwnerMemberProfileCard
              key={member.membership_link_id}
              member={member}
              action={
                <>
                  <View className="flex-1">
                    <Button
                      title="Renew"
                      variant="ghost"
                      onPress={() => {
                        if (!member.member_id) return;
                        setPayAmount('0');
                        void ensureMembershipAndRenew({
                          memberId: member.member_id,
                          membershipId: member.membership_id,
                          fallbackPlanType: member.plan_type,
                        });
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Pay"
                      variant="ghost"
                      onPress={() => {
                        if (!member.member_id) return;
                        setPayAmount('49');
                        setPayTarget({ userId: member.member_id, membershipId: member.membership_id ?? null });
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Remove"
                      variant="danger"
                      onPress={() => setRemoveTarget({ userId: member.member_id, label: member.member_name ?? member.member_phone ?? 'Member' })}
                    />
                  </View>
                </>
              }
            />
          ))}

          {ownerDashboard.isEmpty ? (
            <Card title="No members found">
              <Text className={text.caption}>Try changing search text or filters.</Text>
            </Card>
          ) : null}
        </>
      )}

      <Card title="Pagination">
        <Text className={text.caption}>{ownerDashboard.paginationLabel}</Text>
        <View className={`${layout.stackMd} ${layout.row}`} style={{ gap: spacing[2] }}>
          <View className={layout.flex1}>
            <Button title="Previous" variant="ghost" onPress={ownerDashboard.prevPage} disabled={ownerDashboard.page <= 1} />
          </View>
          <View className={layout.flex1}>
            <Button
              title="Next"
              onPress={ownerDashboard.nextPage}
              disabled={ownerDashboard.page >= ownerDashboard.totalPages}
            />
          </View>
        </View>
      </Card>

      <ModalCard visible={!!payTarget} onClose={() => setPayTarget(null)} anchor="center">
        <Text className={text.cardTitle} style={{ color: colors.foreground }}>
          Record payment
        </Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>Amount (USD)</Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>Renew Plan Type (monthly/quarterly/yearly)</Text>

        <TextInput
          className={`${layout.stack} ${surfaces.inputCompact}`}
          style={inputSurface(colors)}
          value={renewPlanType}
          onChangeText={(value) => setRenewPlanType((value as MembershipPlanType) || 'monthly')}
          placeholderTextColor={colors.placeholder}
        />

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
      </ModalCard>

      <ModalCard visible={!!removeTarget} onClose={() => setRemoveTarget(null)} anchor="center">
        <Text className={text.cardTitle} style={{ color: colors.foreground }}>
          Remove member
        </Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>
          Remove {removeTarget?.label ?? 'this member'} from current members?
        </Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>They can be added again later.</Text>

        <View className={`${layout.stackLg} ${layout.row}`}>
          <View className={layout.flex1}>
            <Button title="Cancel" variant="ghost" onPress={() => setRemoveTarget(null)} disabled={isRemoving} />
          </View>
          <View className={layout.flex1}>
            <Button title="Confirm Remove" variant="danger" onPress={() => void confirmRemoveMember()} loading={isRemoving} />
          </View>
        </View>
      </ModalCard>
    </Screen>
  );
}
