import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';

export function TrainersScreen() {
  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Trainers</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Explore coaching profiles and specialties. Trainer booking modules can be layered here.
      </Text>

      <Card title="Coming soon">
        <Text className={text.caption}>
          This route is ready for trainer discovery, profile cards, and booking integrations.
        </Text>
      </Card>
    </Screen>
  );
}
