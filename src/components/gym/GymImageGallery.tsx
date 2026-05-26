import { Text, View } from 'react-native';
import { ImageOff } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';
import { text as textClasses } from '@/theme/classes';
import { ImageCarousel } from '@/components/gym/ImageCarousel';

type Props = {
  imageUrls: string[];
};

export function GymImageGallery({ imageUrls }: Props) {
  const { colors } = useTheme();

  if (imageUrls.length === 0) {
    return (
      <View className="items-center py-8">
        <ImageOff size={32} color={colors.muted} />
        <Text className={`mt-2 ${textClasses.caption}`} style={{ color: colors.muted }}>
          No photos yet
        </Text>
      </View>
    );
  }

  return <ImageCarousel imageUrls={imageUrls} height={200} borderRadius={16} />;
}
