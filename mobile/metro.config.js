// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Set the app directory for expo-router
process.env.EXPO_ROUTER_APP_ROOT = './app';

// Add path aliases support
const projectRoot = __dirname;

config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot),
  '@/components': path.resolve(projectRoot, 'components'),
  '@/constants': path.resolve(projectRoot, 'constants'),
  '@/hooks': path.resolve(projectRoot, 'hooks'),
  '@/services': path.resolve(projectRoot, 'services')
};

module.exports = config;
