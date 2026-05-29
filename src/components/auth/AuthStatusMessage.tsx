/**
 * @file AuthStatusMessage.tsx
 * Centered info or error message below auth forms (hidden when message is null).
 */
import { Text } from 'react-native';

import { text } from '@/theme/classes';

type AuthStatusMessageProps = {
  message: string | null;
  tone?: 'info' | 'error';
};

export function AuthStatusMessage({ message, tone = 'info' }: AuthStatusMessageProps) {
  if (!message) return null;
  return (
    <Text className={`mt-4 text-center ${tone === 'error' ? text.error : text.bodySm}`}>{message}</Text>
  );
}
