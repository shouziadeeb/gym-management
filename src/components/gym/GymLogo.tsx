import { Image, Text, View } from 'react-native';

import { text } from '@/theme/classes';

type Props = {
  logoUrl?: string | null;
  gymName: string;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_MAP: Record<NonNullable<Props['size']>, number> = {
  sm: 56,
  md: 84,
  lg: 132,
};

export function GymLogo({ logoUrl, gymName, size = 'md' }: Props) {
  const imageSize = SIZE_MAP[size];
  const normalizedUrl = logoUrl?.trim() || '';
  const initial = gymName.trim().charAt(0).toUpperCase() || 'G';

  if (!normalizedUrl) {
    return (
      <View
        className="items-center justify-center rounded-xl border border-slate-700 bg-slate-800"
        style={{ width: imageSize, height: imageSize }}
      >
        <Text className={text.bodySm}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: normalizedUrl }}
      style={{ width: imageSize, height: imageSize, borderRadius: 12, backgroundColor: '#0f172a' }}
      resizeMode="cover"
      accessibilityLabel={`${gymName} logo`}
    />
  );
}
