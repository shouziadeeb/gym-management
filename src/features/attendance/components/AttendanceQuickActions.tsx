import { BarChart3, History, QrCode } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export type AttendanceQuickAction = {
  key: string;
  label: string;
  icon: typeof QrCode;
  onPress: () => void;
};

type Props = {
  actions: AttendanceQuickAction[];
};

export function AttendanceQuickActions({ actions }: Props) {
  const { colors } = useTheme();

  return (
    <View className="flex-row" style={{ gap: spacing[2] }}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            className="flex-1 items-center rounded-2xl border px-2 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.card, minHeight: 72 }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Icon size={20} color={colors.primary} />
            <Text className={`mt-1.5 text-center ${text.caption} text-xs font-semibold`} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const defaultOwnerQuickActions = {
  showQr: { key: 'qr', label: 'Show QR', icon: QrCode },
  history: { key: 'history', label: 'History', icon: History },
  analytics: { key: 'analytics', label: 'Analytics', icon: BarChart3 },
} as const;
