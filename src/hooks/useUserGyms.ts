import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/queries/keys';
import { fetchMemberGyms, fetchOwnedGyms } from '@/api/gyms.api';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';

export function useUserGyms() {
  const userId = useAuthStore((state) => state.session?.user.id);

  const activeOwnerGymId = useAppStore((state) => state.activeOwnerGymId);
  const activeMemberGymId = useAppStore((state) => state.activeMemberGymId);
  const setActiveOwnerGymId = useAppStore((state) => state.setActiveOwnerGymId);
  const setActiveMemberGymId = useAppStore((state) => state.setActiveMemberGymId);

  const ownedQuery = useQuery({
    queryKey: queryKeys.gyms.owned(userId),
    queryFn: () => fetchOwnedGyms(userId!),
    enabled: !!userId,
  });

  const memberQuery = useQuery({
    queryKey: queryKeys.gyms.member(userId),
    queryFn: () => fetchMemberGyms(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!activeOwnerGymId && ownedQuery.data?.length) {
      setActiveOwnerGymId(ownedQuery.data[0].id);
    }
  }, [activeOwnerGymId, ownedQuery.data, setActiveOwnerGymId]);

  useEffect(() => {
    if (!activeMemberGymId && memberQuery.data?.length) {
      setActiveMemberGymId(memberQuery.data[0].id);
    }
  }, [activeMemberGymId, memberQuery.data, setActiveMemberGymId]);

  return {
    ownedGyms: ownedQuery.data ?? [],
    memberGyms: memberQuery.data ?? [],
    isLoading: ownedQuery.isLoading || memberQuery.isLoading,
    error: ownedQuery.error ?? memberQuery.error,
    refetch: () => {
      void ownedQuery.refetch();
      void memberQuery.refetch();
    },
  };
}