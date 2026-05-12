const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase 10.x is incompatible with Metro's package exports resolution.
// The firebase/auth package exports has no react-native condition, so Metro
// falls through to the ESM default build which doesn't reliably register the
// auth component before getAuth() is called.
// Disabling package exports forces legacy field resolution:
//   react-native -> browser -> main
// which correctly picks up @firebase/auth's dist/rn/index.js build.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
