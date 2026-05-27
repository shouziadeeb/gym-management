import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { layout, text } from '@/theme/classes';
import { cardSurface, modalOverlay } from '@/theme/styles';
import { spacing } from '@/theme/spacing';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AttendanceConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end" style={modalOverlay(colors)} onPress={onCancel}>
        <Pressable
          className="mx-4 rounded-3xl p-5"
          style={[cardSurface(colors, true), { marginBottom: spacing[6], maxWidth: 420, alignSelf: 'center', width: '100%' }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className={text.cardTitle}>{title}</Text>
          <Text className={`${layout.stack} ${text.bodySm}`}>{message}</Text>

          <View className="mt-5 flex-row" style={{ gap: spacing[2] }}>
            <View className="flex-1">
              <Button title={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} />
            </View>
            <View className="flex-1">
              <Button
                title={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
