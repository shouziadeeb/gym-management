/**
 * @file MembershipGuestScreen.tsx
 * Shown on the Memberships tab when the user is not signed in (avoids tab-level Redirect crashes on native).
 */
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { routes } from '@/routing/constants';
import { layout, text } from '@/theme/classes';

export function MembershipGuestScreen() {
  const loginParams = {
    redirect: routes.memberships,
    intent: 'member_dashboard' as const,
  };

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>My membership</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Sign in to view your gym memberships, invitations, and attendance.
      </Text>

      <Card title="Account" className={layout.sectionXl}>
        <Button
          title="Login"
          onPress={() => router.push({ pathname: '/auth/login', params: loginParams })}
        />
        <View className={layout.buttonSpacing} />
        <Button
          title="Create account"
          variant="ghost"
          onPress={() => router.push({ pathname: '/auth/signup', params: loginParams })}
        />
      </Card>
    </Screen>
  );
}
