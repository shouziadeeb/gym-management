const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts ?? []), 'mjs'])];

module.exports = withNativeWind(config, { input: './global.css' });
