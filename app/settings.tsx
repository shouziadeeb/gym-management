import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { layout, text } from '@/theme/classes';

export default function SettingsRoute() {
  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Settings</Text>
      <Card title="Account settings">
        <Text className={text.caption}>
          Preferences, notifications, and privacy settings can be managed from this route.
        </Text>
      </Card>
    </Screen>
  );
}
