import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';

type Props = {
  total: number;
  active: number;
  expiring: number;
  expired: number;
};

export function OwnerDashboardStats({ total, active, expiring, expired }: Props) {
  return (
    <Card title="Member Overview">
      <View>
        <Text className={text.bodySm}>Total Members: {total}</Text>
        <Text className={text.bodySm}>Active: {active}</Text>
        <Text className={text.warningBody}>Expiring Soon: {expiring}</Text>
        <Text className={text.error}>Expired: {expired}</Text>
      </View>
    </Card>
  );
}
