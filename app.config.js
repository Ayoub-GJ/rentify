const fs = require('fs');
const path = require('path');

// Load .env manually using __dirname so the path is always relative to this file,
// regardless of what CWD Expo uses when evaluating app.config.js.
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (key) process.env[key] = val;
  });
  console.log('[app.config] .env loaded, OPENAI key length:', process.env.OPENAI_API_KEY?.length ?? 0);
} else {
  console.warn('[app.config] .env file not found at', envPath);
}

module.exports = {
  expo: {
    name: 'Rentify',
    slug: 'rentify',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#FAFAF8',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Rentify utilise votre position pour afficher les objets à louer près de vous et calculer les distances.',
      },
    },
    android: {
      package: 'com.rentify.app',
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#E85D26',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-font', '@react-native-community/datetimepicker'],
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY ?? '',
      firebaseApiKey: process.env.FIREBASE_API_KEY ?? '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
      firebaseAppId: process.env.FIREBASE_APP_ID ?? '',
      eas: {
        projectId: 'e4abb09f-100f-40f3-846f-e7fa7688d57c',
      },
    },
  },
};
