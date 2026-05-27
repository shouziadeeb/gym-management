import { Pressable, Text, View } from 'react-native';
import { RefreshCw, ShieldOff, Trash2 } from 'lucide-react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { spacing } from '@/theme/spacing';

export type QrOptionKey = 'regenerate' | 'disable' | 'delete';

type Option = {
  key: QrOptionKey;
  label: string;
  description: string;
  destructive?: boolean;
  icon: typeof RefreshCw;
};

const OPTIONS: Option[] = [
  {
    key: 'regenerate',
    label: 'Regenerate QR',
    description: 'Creates a new code. The old one stops working.',
    icon: RefreshCw,
  },
  {
    key: 'disable',
    label: 'Disable attendance',
    description: 'Members cannot scan until you enable again.',
    icon: ShieldOff,
  },
  {
    key: 'delete',
    label: 'Delete QR',
    description: 'Removes the code completely.',
    destructive: true,
    icon: Trash2,
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (key: QrOptionKey) => void;
};

export function AttendanceQrOptionsSheet({ visible, onClose, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className={text.cardTitle}>QR options</Text>
      <Text className={`${layout.stackSm} ${text.caption}`}>Manage your attendance code safely.</Text>

      <View className="mt-4" style={{ gap: spacing[2] }}>
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              className="flex-row items-center rounded-2xl border px-3 py-3"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <View
                className="mr-3 rounded-xl p-2"
                style={{ backgroundColor: option.destructive ? `${colors.danger}18` : `${colors.primary}18` }}
              >
                <Icon size={18} color={option.destructive ? colors.danger : colors.primary} />
              </View>
              <View className={layout.flex1}>
                <Text
                  className={`${text.bodySm} font-semibold`}
                  style={option.destructive ? { color: colors.danger } : undefined}
                >
                  {option.label}
                </Text>
                <Text className={`${text.caption} text-xs`}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4">
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
