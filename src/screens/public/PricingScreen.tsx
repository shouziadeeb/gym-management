import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';

export function PricingScreen() {
  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Pricing</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Clear, transparent plans for members and gym owners.
      </Text>

      <Card title="Starter">
        <Text className={text.bodySm}>For solo gyms getting started with digital operations.</Text>
      </Card>

      <Card title="Growth">
        <Text className={text.bodySm}>For gyms managing memberships, payments, and analytics at scale.</Text>
      </Card>
    </Screen>
  );
}
