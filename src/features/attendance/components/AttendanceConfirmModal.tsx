import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { layout, text } from '@/theme/classes';
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
  return (
    <ModalCard visible={visible} onClose={onCancel} anchor="bottom">
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
    </ModalCard>
  );
}
