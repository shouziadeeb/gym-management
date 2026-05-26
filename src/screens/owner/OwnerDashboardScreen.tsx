import { format, parseISO, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';

import { fetchPaymentsForGym } from '@/api/payments.api';
import { queryKeys } from '@/api/queries/keys';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { DATE_FORMAT } from '@/constants/date';
import { useTheme } from '@/hooks/useTheme';
import { useMembershipDashboard } from '@/hooks/useMembershipDashboard';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

export function OwnerDashboardScreen() {
  const { colors } = useTheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const memberships = useMembershipDashboard(activeOwnerGymId ?? undefined);

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.list(activeOwnerGymId ?? undefined),
    queryFn: () => fetchPaymentsForGym(activeOwnerGymId!),
    enabled: !!activeOwnerGymId,
  });

  const payments = paymentsQuery.data ?? [];

  const { chartData, totalCents } = useMemo(() => {
    const monthMap = new Map<string, number>();

    for (const payment of payments) {
      const key = format(startOfMonth(parseISO(payment.paid_at)), DATE_FORMAT.monthKey);
      monthMap.set(key, (monthMap.get(key) ?? 0) + payment.amount_cents);
    }

    const keys = [...monthMap.keys()].sort().slice(-6);
    const bars = keys.map((key) => ({
      value: Math.round((monthMap.get(key) ?? 0) / 100),
      label: format(parseISO(`${key}-01`), DATE_FORMAT.monthLabel),
    }));

    const total = payments.reduce((sum, payment) => sum + payment.amount_cents, 0);
    return { chartData: bars, totalCents: total };
  }, [payments]);

  const chartWidth = Dimensions.get('window').width - 64;

  if (!activeOwnerGymId) {
    return (
      <Screen>
        <Text className={`${layout.screenTopMd} ${text.caption}`}>Select a gym in settings.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Dashboard</Text>
      <Text className={text.caption}>Revenue overview & health</Text>

      <Card title="Total recorded revenue">
        <Text className={text.revenue}>
          ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text className={`${layout.stackSm} ${text.caption}`}>
          From manual entries & integrations. Connect Stripe in a later phase.
        </Text>
      </Card>

      <Card title="Last 6 months">
        {chartData.length === 0 ? (
          <Text className={text.caption}>No payments yet. Log revenue from the Members tab.</Text>
        ) : (
          <View className="items-center overflow-hidden">
            <BarChart
              data={chartData}
              barWidth={28}
              spacing={18}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.chartAxis }}
              xAxisLabelTextStyle={{ color: colors.chartAxis }}
              noOfSections={4}
              maxValue={Math.max(...chartData.map((bar) => bar.value), 1) * 1.2}
              width={chartWidth}
              height={200}
              frontColor={colors.primary}
            />
          </View>
        )}
      </Card>

      <Card title="Memberships pipeline">
        <Text className={text.bodySm}>Active: {memberships.summary.active}</Text>
        <Text className={text.warningBody}>Expiring Soon: {memberships.summary.expiring}</Text>
        <Text className={text.error}>Expired: {memberships.summary.expired}</Text>
        <View className={layout.stackMd}>
          <Button title="Open Membership Lifecycle" onPress={() => router.push('/membership-lifecycle')} />
          <Button title="Attendance dashboard" variant="ghost" onPress={() => router.push('/attendance')} />
        </View>
      </Card>
    </Screen>
  );
}
