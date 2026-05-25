import { Alert, ScrollView, Text, View } from 'react-native';

import { queryKeys } from '@/api/queries/keys';
import { removeMemberFromGym } from '@/api/members.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { queryClient } from '@/api/queries/client';
import { signOut } from '@/services/auth/auth.service';
import { useUserGyms } from '@/hooks/useUserGyms';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { layout, text } from '@/theme/classes';

export function MemberProfileScreen() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const setActiveMemberGymId = useAppStore((state) => state.setActiveMemberGymId);
  const setAppMode = useAppStore((state) => state.setAppMode);
  const resetGymContext = useAppStore((state) => state.resetGymContext);

  const { memberGyms, ownedGyms } = useUserGyms();

  async function handleSignOut() {
    await signOut();
    resetGymContext();
  }

  async function leaveGym() {
    if (!userId || !activeMemberGymId) return;

    try {
      await removeMemberFromGym(activeMemberGymId, userId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
      setActiveMemberGymId(null);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }

  return (
    <Screen scroll>
      <Text className={`${layout.screenTop} ${text.screenTitleLg}`}>Profile</Text>

      {memberGyms.length > 1 ? (
        <Card title="Training at">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className={layout.row}>
              {memberGyms.map((gym) => (
                <Chip
                  key={gym.id}
                  label={gym.name}
                  active={gym.id === activeMemberGymId}
                  onPress={() => setActiveMemberGymId(gym.id)}
                />
              ))}
            </View>
          </ScrollView>
        </Card>
      ) : null}

      {activeMemberGymId ? (
        <Card title="Membership">
          <Button
            title="Leave this gym"
            variant="danger"
            onPress={() =>
              Alert.alert('Leave gym?', 'You will lose access until the owner adds you again.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: leaveGym },
              ])
            }
          />
        </Card>
      ) : null}

      {ownedGyms.length > 0 ? (
        <Card title="Switch view">
          <Text className={`mb-3 ${text.caption}`}>Manage the gyms you own.</Text>
          <Button title="Open owner dashboard" variant="ghost" onPress={() => setAppMode('owner')} />
        </Card>
      ) : null}

      <Button title="Sign out" variant="ghost" onPress={handleSignOut} />
    </Screen>
  );
}
