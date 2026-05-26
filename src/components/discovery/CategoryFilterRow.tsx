import { Pressable, Text } from 'react-native';

import { FullWidthHorizontalScroll } from '@/components/ui/FullWidthHorizontalScroll';
import { useTheme } from '@/hooks/useTheme';
import { surfaces } from '@/theme/classes';
import { chipLabelColor, chipSurface } from '@/theme/styles';

type Props = {
  options: string[];
  selected: string[];
  onToggle: (slug: string) => void;
};

export function CategoryFilterRow({ options, selected, onToggle }: Props) {
  const { colors } = useTheme();

  return (
    <FullWidthHorizontalScroll>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <Pressable
            key={option}
            className={surfaces.chip}
            style={chipSurface(colors, active)}
            onPress={() => onToggle(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Category ${option}`}
          >
            <Text className="font-semibold" style={{ color: chipLabelColor(colors, active) }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </FullWidthHorizontalScroll>
  );
}
