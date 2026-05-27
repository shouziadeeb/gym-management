import { Redirect } from 'expo-router';

import { routes } from '@/routing/constants';

/** Legacy stack path — always land on the Memberships tab. */
export default function MembershipsRoute() {
  return <Redirect href={routes.memberships} />;
}
