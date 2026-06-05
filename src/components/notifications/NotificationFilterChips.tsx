import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { NOTIFICATION_FILTER_OPTIONS, type NotificationFilterCategory } from '@/domain/notifications/types';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  value: NotificationFilterCategory;
  onChange: (value: NotificationFilterCategory) => void;
};

export function NotificationFilterChips({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {NOTIFICATION_FILTER_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.chipInactive,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? colors.primaryForeground : colors.foreground,
                fontWeight: selected ? '700' : '500',
                fontSize: 13,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
