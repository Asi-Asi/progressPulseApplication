// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro'); // ✅ correct import & casing

const config = getDefaultConfig(__dirname);

// SVG via react-native-svg-transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Wrap with NativeWind (points to your global CSS, adjust if different)
module.exports = withNativeWind(config, { input: './styles/global.css' });
