import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { ENV } from '../config/env';

let configured = false;

function configureOnce() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  configureOnce();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const userInfo = await GoogleSignin.signIn();
  const idToken =
    (userInfo as any).data?.idToken ?? (userInfo as any).idToken;

  if (!idToken) {
    throw new Error('Google Sign-In: no idToken returned');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  const userRef = doc(db, 'users', userCredential.user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      nom: userCredential.user.displayName ?? '',
      photoURL: userCredential.user.photoURL ?? '',
      telephone: '',
      ville: '',
      createdAt: serverTimestamp(),
      provider: 'google',
    });
  }

  return userCredential;
}

export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Silencieux : l'utilisateur n'était peut-être pas connecté via Google
  }
}

export { statusCodes };
