import { Text, View } from 'react-native';

import { text } from '@/theme/classes';

type Props = {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

export function AttendanceSectionHeader({ title, subtitle, trailing }: Props) {
  return (
    <View className="mb-2 flex-row items-end justify-between">
      <View className="flex-1 pr-2">
        <Text className={text.listTitle}>{title}</Text>
        {subtitle ? <Text className={`${text.caption} text-xs`}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}
