/** Expo route: /auth/login — renders hybrid OTP login screen. */
import { HybridAuthScreen } from '@/screens/auth/HybridAuthScreen';

export default function LoginRoute() {
  return <HybridAuthScreen mode="login" />;
}

