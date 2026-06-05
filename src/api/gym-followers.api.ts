import { supabase } from '@/lib/supabase';

export async function fetchFollowedGymIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('gym_followers')
    .select('gym_id')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row) => row.gym_id as string);
}

export async function followGym(gymId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('gym_followers').insert({
    gym_id: gymId,
    user_id: userId,
  });

  if (error?.code === '23505') return;
  if (error) throw error;
}

export async function unfollowGym(gymId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('gym_followers')
    .delete()
    .eq('gym_id', gymId)
    .eq('user_id', userId);

  if (error) throw error;
}
