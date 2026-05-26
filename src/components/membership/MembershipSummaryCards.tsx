import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';

type Props = {
  active: number;
  expiring: number;
  expired: number;
};

export function MembershipSummaryCards({ active, expiring, expired }: Props) {
  return (
    <View>
      <Card title="Membership Summary">
        <Text className={text.bodySm}>Active: {active}</Text>
        <Text className={text.warningBody}>Expiring Soon: {expiring}</Text>
        <Text className={text.error}>Expired: {expired}</Text>
      </Card>
    </View>
  );
}
