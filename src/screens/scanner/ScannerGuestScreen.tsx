import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { routes } from '@/routing/constants';
import { layout, text } from '@/theme/classes';

export function ScannerGuestScreen() {
  const loginParams = {
    redirect: routes.scanner,
    intent: 'member_dashboard' as const,
  };

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Scan & check in</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Sign in to scan attendance QR codes at your gym, or manage your gym QR as an owner.
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
