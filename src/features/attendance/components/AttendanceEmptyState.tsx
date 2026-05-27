import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { text } from '@/theme/classes';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function AttendanceEmptyState({ title, description, action, compact }: Props) {
  return (
    <View className={`items-center ${compact ? 'py-6' : 'py-10'}`}>
      <Text className={`text-center ${text.listTitle}`}>{title}</Text>
      {description ? <Text className={`mt-1 text-center ${text.caption}`}>{description}</Text> : null}
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}
