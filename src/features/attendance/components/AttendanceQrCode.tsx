import QRCode from 'react-native-qrcode-svg';
import { Text, View } from 'react-native';

import { buildAttendanceQrPayload } from '@/features/attendance/domain/qr-payload';
import { useTheme } from '@/hooks/useTheme';
import { webFullWidthStyle } from '@/lib/web-layout';
import { text } from '@/theme/classes';

type Props = {
  token: string;
  size?: number;
  label?: string;
};

export function AttendanceQrCode({ token, size = 220, label }: Props) {
  const { colors } = useTheme();
  const value = buildAttendanceQrPayload(token);

  return (
    <View className="w-full items-center" style={webFullWidthStyle}>
      <View
        className="w-full items-center rounded-3xl border p-4"
        style={{ borderColor: colors.border, backgroundColor: colors.card, ...webFullWidthStyle }}
      >
        <QRCode value={value} size={size} backgroundColor={colors.card} color={colors.foreground} />
      </View>
      {label ? <Text className={`mt-3 text-center ${text.caption}`}>{label}</Text> : null}
      <Text className={`mt-2 text-center ${text.meta}`}>Members scan this code to check in.</Text>
    </View>
  );
}
