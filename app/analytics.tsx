import { Redirect } from 'expo-router';
import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useRequireCompletedProfile } from '@/hooks/useRequireCompletedProfile';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';

export default function AnalyticsRoute() {
  const session = useAuthStore((state) => state.session);
  const { isLoading, isProfileComplete } = useRequireCompletedProfile();
  if (!session) return <Redirect href="/auth/login?redirect=/analytics&intent=owner_dashboard" />;
  if (isLoading) return null;
  if (!isProfileComplete) return <Redirect href="/profile-setup?redirect=/analytics" />;

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitle}`}>Analytics</Text>
      <Card title="Coming soon">
        <Text className={text.caption}>Owner analytics dashboards will be added here.</Text>
      </Card>
    </Screen>
  );
}
