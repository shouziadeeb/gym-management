import { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { webFullWidthStyle } from '@/lib/web-layout';
import { surfaces, text } from '@/theme/classes';
import { cardSurface, highlightBorder } from '@/theme/styles';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
};

export function Card({ title, children, className, highlighted }: Props) {
  const { colors } = useTheme();

  const surfaceStyle: ViewStyle = {
    ...cardSurface(colors),
    ...(highlighted ? highlightBorder(colors) : null),
  };

  return (
    <View className={`${surfaces.card} ${className ?? ''}`} style={[surfaceStyle, webFullWidthStyle]}>
      {title ? (
        <Text className={`mb-2 ${text.cardTitle}`} style={{ color: colors.foreground }}>
          {title}
        </Text>
      ) : null}
      {children != null ? <View className={`${surfaces.cardInner}`}>{children}</View> : null}
    </View>
  );
}
