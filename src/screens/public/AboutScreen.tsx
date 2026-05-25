import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';

export function AboutScreen() {
  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>About GYM OS</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        GYM OS helps gym owners and members operate in one modern platform.
      </Text>

      <Card title="Mission">
        <Text className={text.bodySm}>
          Build a unified gym operating system for memberships, attendance, payments, and engagement.
        </Text>
      </Card>
    </Screen>
  );
}
