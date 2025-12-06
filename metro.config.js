// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for better TypeScript support
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'ts', 'tsx'],
};

module.exports = config;
