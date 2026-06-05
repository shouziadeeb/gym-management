import { router } from 'expo-router';
import { Platform } from 'react-native';

/** Hard navigation — on web uses full page replace to escape stuck React/bootstrap states. */
export function authNavigate(href: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace(href);
    return;
  }

  router.replace(href as never);
}
