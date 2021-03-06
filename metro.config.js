// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    ],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    extraNodeModules: {
      crypto: './node_modules/react-native-crypto',
      stream: require.resolve('readable-stream'),
    },
  },
};
