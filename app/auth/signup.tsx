/** Expo route: /auth/signup — renders hybrid OTP signup screen. */
import { HybridAuthScreen } from '@/screens/auth/HybridAuthScreen';

export default function SignupRoute() {
  return <HybridAuthScreen mode="signup" />;
}

