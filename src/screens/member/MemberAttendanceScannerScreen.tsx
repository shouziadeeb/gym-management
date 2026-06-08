import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  AttendanceErrorState,
  AttendanceScanner,
  AttendanceSuccessState,
  useAttendanceScanner,
} from '@/features/attendance';
import { useAppStore } from '@/store/app.store';
import { layout, text } from '@/theme/classes';

export function MemberAttendanceScannerScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const { processScan, reset, lastResult, errorMessage, isProcessing } = useAttendanceScanner(activeMemberGymId ?? undefined);
  const autoScannedRef = useRef(false);

  const tokenParam = Array.isArray(token) ? token[0] : token;

  useEffect(() => {
    if (!tokenParam || autoScannedRef.current || lastResult) return;
    autoScannedRef.current = true;
    void processScan(tokenParam);
  }, [tokenParam, processScan, lastResult]);

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Scan attendance</Text>
      <Text className={text.caption}>Point your camera at the gym&apos;s attendance QR code.</Text>

      <View className={layout.sectionLg}>
        <AttendanceScanner onScan={processScan} isProcessing={isProcessing} disabled={Boolean(lastResult?.success)} />
      </View>

      {lastResult?.success ? (
        <View className={layout.section}>
          <AttendanceSuccessState result={lastResult} />
          <View className={layout.stackMd}>
            <Button title="Scan again" variant="ghost" onPress={reset} />
            <Button title="View history" onPress={() => router.push('/attendance-history')} />
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <View className={layout.section}>
          <AttendanceErrorState message={errorMessage} />
          <View className={layout.stackMd}>
            <Button title="Try again" onPress={reset} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
