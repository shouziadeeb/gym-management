import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { queryKeys } from '@/api/queries/keys';
import { removeMemberFromGym } from '@/api/members.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { getErrorMessage } from '@/lib/errors';
import { queryClient } from '@/api/queries/client';
import { signOut } from '@/services/auth/auth.service';
import { useUserGyms } from '@/hooks/useUserGyms';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';

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
      <Text className="pt-6 text-2xl font-bold text-slate-900 dark:text-white">Profile</Text>

      {memberGyms.length > 1 ? (
        <Card title="Training at">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {memberGyms.map((gym) => (
                <Pressable
                  key={gym.id}
                  onPress={() => setActiveMemberGymId(gym.id)}
                  className={`rounded-xl px-3 py-2 ${gym.id === activeMemberGymId ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  <Text
                    className={
                      gym.id === activeMemberGymId ? 'font-semibold text-white' : 'text-slate-900 dark:text-slate-100'
                    }
                  >
                    {gym.name}
                  </Text>
                </Pressable>
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
          <Text className="mb-3 text-slate-600 dark:text-slate-400">Manage the gyms you own.</Text>
          <Button title="Open owner dashboard" variant="ghost" onPress={() => setAppMode('owner')} />
        </Card>
      ) : null}

      <Button title="Sign out" variant="ghost" onPress={handleSignOut} />
    </Screen>
  );
}