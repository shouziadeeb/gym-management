import { Pressable, Text } from 'react-native';

import { FullWidthHorizontalScroll } from '@/components/ui/FullWidthHorizontalScroll';
import { useTheme } from '@/hooks/useTheme';
import { surfaces } from '@/theme/classes';
import { chipLabelColor, chipSurface } from '@/theme/styles';

type Option = { id: string; label: string };

type Props = {
  options: readonly Option[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ChipToggleRow({ options, selectedId, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <FullWidthHorizontalScroll>
      {options.map((option) => {
        const active = option.id === selectedId;

        return (
          <Pressable
            key={option.id}
            className={surfaces.chip}
            style={chipSurface(colors, active)}
            onPress={() => onSelect(option.id)}
          >
            <Text className="font-semibold" style={{ color: chipLabelColor(colors, active) }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </FullWidthHorizontalScroll>
  );
}
