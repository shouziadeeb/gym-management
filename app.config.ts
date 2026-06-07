import type { ExpoConfig } from 'expo/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appJson = require('./app.json') as { expo: ExpoConfig };

const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

export default (): ExpoConfig => {
  const plugins = (appJson.expo.plugins ?? []).map((plugin) => {
    if (plugin === '@react-native-google-signin/google-signin' && iosUrlScheme) {
      return ['@react-native-google-signin/google-signin', { iosUrlScheme }];
    }
    return plugin;
  });

  return {
    ...appJson.expo,
    plugins,
  };
};
