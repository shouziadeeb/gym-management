import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { text } from '@/theme/classes';

export function OwnerMemberListSkeleton() {
  return (
    <View>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`skeleton-${index}`}>
          <Text className={text.loading}>Loading member...</Text>
        </Card>
      ))}
    </View>
  );
}
