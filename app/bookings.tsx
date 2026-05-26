import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ProtectedRoute, routes } from '@/routing';
import { layout, text } from '@/theme/classes';

export default function BookingsRoute() {
  return (
    <ProtectedRoute redirectPath={routes.bookings} authIntent="member_dashboard" requireProfile>
      <Screen scroll>
        <Text className={`${layout.screenTop} ${text.screenTitle}`}>Bookings</Text>
        <Card title="Coming soon">
          <Text className={text.caption}>Class and session booking flows will be added here.</Text>
        </Card>
      </Screen>
    </ProtectedRoute>
  );
}
