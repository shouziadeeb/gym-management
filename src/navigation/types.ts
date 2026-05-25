export type RootStackParamList = {
  Home: undefined;
  GymDetail: { gymId: string } | undefined;
  Auth: undefined;
  Loading: undefined;
  MemberOnboarding: undefined;
  OwnerOnboarding: undefined;
  Owner: undefined;
  Member: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}