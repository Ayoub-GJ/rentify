# RENTIFY - Context for Claude Code

## Project Overview
Rentify is a peer-to-peer object rental mobile app (like Airbnb but for objects).
Built with React Native + TypeScript + Expo + Firebase.

## Tech Stack
- **Frontend**: React Native, TypeScript, Expo (managed workflow)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Navigation**: React Navigation (Stack)
- **Target**: Android (Expo Go for development)

## Project Structure
```
rentify/
├── src/
│   ├── config/
│   │   └── firebase.config.ts    # Firebase initialization
│   ├── types/
│   │   ├── User.ts               # User interface
│   │   ├── Item.ts               # Item interface + Categorie enum
│   │   ├── Rental.ts             # Rental interface + StatutDemande enum
│   │   ├── Message.ts            # Message + Conversation interfaces
│   │   └── index.ts              # Central exports
│   ├── services/
│   │   ├── authService.ts        # signup, login, logout, getCurrentUser
│   │   ├── firestoreService.ts   # CRUD for items and rentals
│   │   └── index.ts              # Central exports
│   ├── screens/
│   │   └── auth/
│   │       ├── LoginScreen.tsx   # Email/password login form
│   │       └── SignupScreen.tsx  # Registration form
│   ├── navigation/
│   │   └── AuthNavigator.tsx     # Stack navigator for auth screens
│   └── components/               # (empty, to be created)
├── App.tsx                        # Entry point with NavigationContainer
└── CLAUDE.md                      # This file
```

## Firebase Auth Fix ✅
**Error was**: `[runtime not ready]: Error: Component auth has not been registered yet`

**Root cause (confirmed)**:
Metro 0.83.x has `unstable_enablePackageExports: true` by default. The `firebase` package exports field for `./auth` has no `react-native` condition, so Metro falls through to the ESM `default` build (`auth/dist/esm/index.esm.js`). That ESM stub doesn't reliably register the Firebase auth component before `getAuth()` is called, causing the crash.

**Fix applied**:
1. `metro.config.js` created with `config.resolver.unstable_enablePackageExports = false`
   - Forces legacy field resolution: `react-native` → `browser` → `main`
   - Metro now picks up `@firebase/auth`'s `dist/rn/index.js` (React Native build) which correctly registers auth
2. `firebase.config.ts` uses `getAuth(app)` (not `initializeAuth` with AsyncStorage)

## Firebase Config (Current - Broken)
```typescript
// src/config/firebase.config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCCl7kfaCpuj4hdrR1Uh9kq7lM4nn__J5U",
  authDomain: "rentify-app-67083.firebaseapp.com",
  projectId: "rentify-app-67083",
  storageBucket: "rentify-app-67083.firebasestorage.app",
  messagingSenderId: "1072638859123",
  appId: "1:1072638859123:web:a84c170960d172993bd706"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## Key Firebase Collections (Firestore)
- `users` → User profiles
- `items` → Objects for rent
- `rentals` → Rental requests (PENDING/ACCEPTED/REJECTED/CANCELLED/COMPLETED)
- `conversations` → Chat threads
  - `messages` → Sub-collection

## Commands
```bash
# Start development
npx expo start --clear

# Install packages (always use npx expo install for native modules)
npx expo install <package>

# Check TypeScript errors
npx tsc --noEmit
```

## Important Notes
- Always use `npx expo install` (not npm) for native modules
- Firebase credentials are real - do not change them
- Target is Android only for now
- No payment system in MVP