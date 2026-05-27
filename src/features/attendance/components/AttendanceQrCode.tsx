import { Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text, View } from 'react-native';

import { buildAttendanceQrPayload } from '@/features/attendance/domain/qr-payload';
import { useTheme } from '@/hooks/useTheme';
import { webFullWidthStyle } from '@/lib/web-layout';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  token: string;
  size?: number;
  label?: string;
};

/** QR modules always render on white for reliable scanning in dark mode. */
export function AttendanceQrCode({ token, size = 220, label }: Props) {
  const { colors } = useTheme();
  const value = buildAttendanceQrPayload(token);
  const qrSize = Platform.OS === 'web' ? Math.min(size, 260) : size;

  return (
    <View className="w-full items-center" style={webFullWidthStyle}>
      <View
        className="items-center rounded-3xl p-5"
        style={{
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: `${colors.primary}33`,
          shadowColor: colors.primary,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
          ...webFullWidthStyle,
        }}
      >
        <QRCode value={value} size={qrSize} backgroundColor="#ffffff" color="#0f172a" />
      </View>

      {label ? (
        <Text className={`mt-4 text-center ${text.caption}`} style={{ color: colors.foregroundSecondary }}>
          {label}
        </Text>
      ) : null}
      <Text className="mt-2 text-center text-xs" style={{ color: colors.muted, paddingHorizontal: spacing[4] }}>
        Members scan this code to check in at your gym.
      </Text>
    </View>
  );
}
