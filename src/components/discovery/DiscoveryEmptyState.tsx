import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { layout, text } from '@/theme/classes';

type Props = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function DiscoveryEmptyState({ title, subtitle, actionLabel, onActionPress }: Props) {
  return (
    <Card>
      <View className={`${layout.stackMd} px-3 py-6`}>
        <Text className={text.cardTitle}>{title}</Text>
        <Text className={`${layout.stack} ${text.caption}`}>{subtitle}</Text>
        {actionLabel && onActionPress ? (
          <View className={layout.stackMd}>
            <Button title={actionLabel} variant="ghost" onPress={onActionPress} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
