import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// getReactNativePersistence lives in @firebase/auth's RN build (dist/rn/index.js) at runtime
// but is absent from firebase/auth's shared TypeScript declaration file (auth-public.d.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => import('firebase/auth').Persistence;
};

const firebaseConfig = {
  apiKey: "AIzaSyCCl7kfaCpuj4hdrR1Uh9kq7lM4nn__J5U",
  authDomain: "rentify-app-67083.firebaseapp.com",
  projectId: "rentify-app-67083",
  storageBucket: "rentify-app-67083.firebasestorage.app",
  messagingSenderId: "1072638859123",
  appId: "1:1072638859123:web:a84c170960d172993bd706"
};

// isFirstInit must be captured before initializeApp, because initializeApp adds to getApps().
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// On first init use initializeAuth to set AsyncStorage persistence.
// On hot-reload the app already exists and auth is already initialized — getAuth retrieves it.
export const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
