import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ProtectedRoute, routes } from '@/routing';
import { layout, text } from '@/theme/classes';

export default function AnalyticsRoute() {
  return (
    <ProtectedRoute redirectPath={routes.analytics} authIntent="owner_dashboard" requireProfile>
      <Screen scroll>
        <Text className={`${layout.screenTop} ${text.screenTitle}`}>Analytics</Text>
        <Card title="Coming soon">
          <Text className={text.caption}>Owner analytics dashboards will be added here.</Text>
        </Card>
      </Screen>
    </ProtectedRoute>
  );
}
