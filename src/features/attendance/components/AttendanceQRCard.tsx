import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { AttendanceQrCode } from '@/features/attendance/components/AttendanceQrCode';
import { useTheme } from '@/hooks/useTheme';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

type Props = {
  token: string;
  label?: string;
  enabled: boolean;
  generatedLabel?: string;
  footer?: ReactNode;
  qrSize?: number;
};

export function AttendanceQRCard({ token, label, enabled, generatedLabel, footer, qrSize = 240 }: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="w-full overflow-hidden rounded-3xl border"
      style={{
        borderColor: enabled ? `${colors.primary}44` : colors.border,
        backgroundColor: colors.card,
      }}
    >
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View>
          <Text className={text.cardTitle}>Attendance QR</Text>
          {generatedLabel ? <Text className={`${text.caption} text-xs`}>{generatedLabel}</Text> : null}
        </View>
        <View
          className="flex-row items-center rounded-full px-3 py-1"
          style={{ backgroundColor: enabled ? `${colors.primary}18` : `${colors.muted}22` }}
        >
          <View
            className="mr-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: enabled ? colors.success : colors.muted }}
          />
          <Text className="text-xs font-semibold" style={{ color: enabled ? colors.primary : colors.muted }}>
            {enabled ? 'Live' : 'Paused'}
          </Text>
        </View>
      </View>

      <View className="items-center px-4 py-5">
        <AttendanceQrCode token={token} size={qrSize} label={label} />
      </View>

      {footer ? (
        <View className="px-4 pb-4" style={{ gap: spacing[2] }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
