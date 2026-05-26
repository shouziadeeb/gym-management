import { Text, View } from 'react-native';

import { layout, text } from '@/theme/classes';

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <View className={layout.sectionLg}>
      <Text className={text.screenTitleMd}>{title}</Text>
      {subtitle ? <Text className={`${layout.stack} ${text.caption}`}>{subtitle}</Text> : null}
    </View>
  );
}
