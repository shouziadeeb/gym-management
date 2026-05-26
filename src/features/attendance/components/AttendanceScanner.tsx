import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';

type Props = {
  onScan: (value: string) => void | Promise<unknown>;
  disabled?: boolean;
  isProcessing?: boolean;
};

export function AttendanceScanner({ onScan, disabled = false, isProcessing = false }: Props) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const lastScanRef = useRef<string | null>(null);
  const scanLockRef = useRef(false);

  const handleBarcode = useCallback(
    async (result: BarcodeScanningResult) => {
      if (disabled || isProcessing || scanLockRef.current) return;
      const value = result.data?.trim();
      if (!value || value === lastScanRef.current) return;

      scanLockRef.current = true;
      lastScanRef.current = value;
      try {
        await onScan(value);
      } finally {
        setTimeout(() => {
          scanLockRef.current = false;
        }, 1800);
      }
    },
    [disabled, isProcessing, onScan],
  );

  if (Platform.OS === 'web') {
    return (
      <View className={`${layout.section} items-center rounded-2xl border p-6`} style={{ borderColor: colors.border }}>
        <Text className={`text-center ${text.body}`}>QR scanning requires the mobile app.</Text>
        <Text className={`mt-2 text-center ${text.caption}`}>
          Open GYM on your phone to scan the gym attendance QR code.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.primary} />
        <Text className={`mt-3 ${text.caption}`}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className={`${layout.section} items-center rounded-2xl border p-6`} style={{ borderColor: colors.border }}>
        <Text className={`text-center ${text.body}`}>Camera access is required to scan attendance QR codes.</Text>
        <View className={`${layout.stackMd} w-full max-w-xs`}>
          <Button title="Allow camera" onPress={() => void requestPermission()} />
        </View>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-3xl border" style={{ borderColor: colors.border }}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={disabled || isProcessing ? undefined : handleBarcode}
      />
      <View style={styles.overlay}>
        <View style={[styles.frame, { borderColor: colors.primary }]} />
        {isProcessing ? (
          <View style={styles.processing}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.processingText}>Marking attendance…</Text>
          </View>
        ) : (
          <Text style={styles.hint}>Align the gym QR code inside the frame</Text>
        )}
      </View>
      <Pressable
        onPress={() => setTorch((current) => !current)}
        style={[styles.torchButton, { backgroundColor: colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel="Toggle flashlight"
      >
        <Text style={{ color: colors.foreground }}>{torch ? 'Flash off' : 'Flash on'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { width: '100%', aspectRatio: 3 / 4, minHeight: 320 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  frame: {
    width: '72%',
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  processing: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  processingText: { color: '#fff', fontWeight: '600' },
  torchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
