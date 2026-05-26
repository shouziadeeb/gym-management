import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { layout, text } from '@/theme/classes';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className={`${layout.section} items-center px-4 py-8`}>
      <Text className={`text-center ${text.cardTitle}`}>{title}</Text>
      {description ? (
        <Text className={`mt-2 text-center ${text.caption}`}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className={`${layout.stackMd} w-full max-w-xs`}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
