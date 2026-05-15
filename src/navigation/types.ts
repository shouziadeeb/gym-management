export type RootStackParamList = {
  Auth: undefined;
  Loading: undefined;
  Onboarding: undefined;
  Owner: undefined;
  Member: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}