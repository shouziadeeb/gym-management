import { format, parseISO, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { Dimensions, Text, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from 'react-native-gifted-charts';

import { fetchPaymentsForGym } from '@/api/payments.api';
import { queryKeys } from '@/api/queries/keys';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { DATE_FORMAT } from '@/constants/date';
import { useAppStore } from '@/store/app.store';

export function OwnerDashboardScreen() {
  const scheme = useColorScheme();
  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);

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
        <Text className="pt-8 text-slate-600 dark:text-slate-400">Select a gym in settings.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className="pt-6 text-2xl font-bold text-slate-900 dark:text-white">Dashboard</Text>
      <Text className="text-slate-600 dark:text-slate-400">Revenue overview & health</Text>

      <Card title="Total recorded revenue">
        <Text className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          From manual entries & integrations. Connect Stripe in a later phase.
        </Text>
      </Card>

      <Card title="Last 6 months">
        {chartData.length === 0 ? (
          <Text className="text-slate-500 dark:text-slate-400">No payments yet. Log revenue from the Members tab.</Text>
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
              yAxisTextStyle={{ color: scheme === 'dark' ? '#94a3b8' : '#64748b' }}
              xAxisLabelTextStyle={{ color: scheme === 'dark' ? '#94a3b8' : '#64748b' }}
              noOfSections={4}
              maxValue={Math.max(...chartData.map((bar) => bar.value), 1) * 1.2}
              width={chartWidth}
              height={200}
              frontColor="#16a34a"
            />
          </View>
        )}
      </Card>

      <Card title="Memberships pipeline">
        <Text className="text-slate-600 dark:text-slate-300">
          Track upcoming expirations under Members. Automated reminders run via Supabase Edge Functions + Expo push.
        </Text>
      </Card>
    </Screen>
  );
}