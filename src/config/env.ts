import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const ENV = (() => {
  const keys = {
    OPENAI_API_KEY: (extra.openaiApiKey as string) ?? '',
    FIREBASE_API_KEY: (extra.firebaseApiKey as string) ?? '',
    FIREBASE_AUTH_DOMAIN: (extra.firebaseAuthDomain as string) ?? '',
    FIREBASE_PROJECT_ID: (extra.firebaseProjectId as string) ?? '',
    FIREBASE_STORAGE_BUCKET: (extra.firebaseStorageBucket as string) ?? '',
    FIREBASE_MESSAGING_SENDER_ID: (extra.firebaseMessagingSenderId as string) ?? '',
    FIREBASE_APP_ID: (extra.firebaseAppId as string) ?? '',
  };
  console.log('[ENV] OpenAI key starts with:', keys.OPENAI_API_KEY.substring(0, 10) || 'EMPTY');
  return keys;
})();
