import { useLocalSearchParams } from 'expo-router';

import { GymDetailScreen } from '@/screens/public/GymDetailScreen';

export default function GymDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <GymDetailScreen gymId={typeof id === 'string' ? id : undefined} />;
}

