/**
 * @file LoginScreen.tsx
 * Thin wrapper around HybridAuthScreen for legacy imports and route compatibility.
 */
import { HybridAuthScreen } from '@/screens/auth/HybridAuthScreen';
import type { AuthScreenMode } from '@/services/auth/auth.types';

type AuthScreenProps = {
  mode?: AuthScreenMode;
};

/** @deprecated Use `HybridAuthScreen` directly — kept for route compatibility. */
export function LoginScreen(props: AuthScreenProps) {
  return <HybridAuthScreen {...props} />;
}
