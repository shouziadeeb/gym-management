import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { layout, text } from '@/theme/classes';

type Props = {
  todayCount: number;
  enabled: boolean;
  hasQr: boolean;
};

export function AttendanceStatsCard({ todayCount, enabled, hasQr }: Props) {
  return (
    <Card title="Today">
      <Text className={text.revenue}>{todayCount}</Text>
      <Text className={`${layout.stackSm} ${text.caption}`}>Members checked in today</Text>
      <Text className={`${layout.stack} ${text.bodySm}`}>
        System: {enabled && hasQr ? 'Active' : 'Inactive'}
      </Text>
    </Card>
  );
}
