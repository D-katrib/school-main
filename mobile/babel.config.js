module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Reanimated plugin (if you're using reanimated)
      'react-native-reanimated/plugin',
      // Module resolver for path aliases
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/constants': './constants',
            '@/hooks': './hooks',
            '@/services': './services'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      ]
    ],
  };
};
