import { Pressable, Text } from 'react-native';

import { FullWidthHorizontalScroll } from '@/components/ui/FullWidthHorizontalScroll';
import { NOTIFICATION_FILTER_OPTIONS, type NotificationFilterCategory } from '@/domain/notifications/types';
import { useTheme } from '@/hooks/useTheme';
import { surfaces } from '@/theme/classes';
import { chipLabelColor, chipSurface } from '@/theme/styles';

type Props = {
  value: NotificationFilterCategory;
  onChange: (value: NotificationFilterCategory) => void;
};

export function NotificationFilterChips({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <FullWidthHorizontalScroll gap={8}>
      {NOTIFICATION_FILTER_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            className={surfaces.chip}
            style={chipSurface(colors, selected)}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Filter ${option.label}`}
          >
            <Text className="font-semibold" style={{ color: chipLabelColor(colors, selected) }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </FullWidthHorizontalScroll>
  );
}
