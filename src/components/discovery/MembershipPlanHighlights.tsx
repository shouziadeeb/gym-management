import { memo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { MembershipPlanHighlight } from '@/domain/discovery/home-feed';

import { Button } from '@/components/ui/Button';
import { layout, surfaces, text } from '@/theme/classes';
import { cardSurface } from '@/theme/styles';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  plans: MembershipPlanHighlight[];
};

export const MembershipPlanHighlights = memo(function MembershipPlanHighlights({ plans }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingVertical: 4 }}
    >
      {plans.map((plan) => (
        <View
          key={plan.id}
          className={`${surfaces.card} w-64`}
          style={cardSurface(colors, true)}
        >
          <Text className={text.cardTitle}>{plan.pricingLabel}</Text>
          <Text className={`${layout.stackSm} ${text.caption}`}>{plan.planLabel}</Text>
          <Text className={`${layout.stack} ${text.bodySm}`}>{plan.gymName}</Text>
          <View className={layout.stackMd}>
            <Button title="View gym" variant="ghost" onPress={() => router.push(`/gym/${plan.gymId}`)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
});
