import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { User, SignupData, LoginData } from '../types';

export const signup = async (data: SignupData): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;
    const prenom = (data.prenom ?? '').trim();
    const nom = (data.nom ?? '').trim();

    await updateProfile(firebaseUser, {
      displayName: `${prenom} ${nom}`.trim(),
    });

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email: data.email,
      prenom,
      nom,
      telephone: data.telephone ?? '',
      ville: data.ville ?? '',
      photoURL: '',
      createdAt: serverTimestamp(),
    });

    return {
      uid: firebaseUser.uid,
      email: data.email,
      prenom,
      nom,
      telephone: data.telephone,
      ville: data.ville,
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Erreur signup:', error);
    throw new Error(error.message || 'Erreur lors de l\'inscription');
  }
};

export const login = async (data: LoginData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('Profil utilisateur introuvable');
    }

    const d = userDoc.data();

    return {
      uid: firebaseUser.uid,
      email: d.email,
      prenom: d.prenom ?? '',
      nom: d.nom ?? '',
      telephone: d.telephone,
      ville: d.ville,
      photoURL: d.photoURL ?? d.photoUrl,
      createdAt: d.createdAt instanceof Timestamp
        ? d.createdAt.toDate()
        : d.dateInscription
          ? new Date(d.dateInscription)
          : new Date(),
    };
  } catch (error: any) {
    console.error('Erreur login:', error);
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erreur logout:', error);
    throw new Error(error.message || 'Erreur lors de la déconnexion');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const getCurrentUserProfile = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) return null;

  const d = userDoc.data();

  return {
    uid: firebaseUser.uid,
    email: d.email,
    prenom: d.prenom ?? '',
    nom: d.nom ?? '',
    telephone: d.telephone,
    ville: d.ville,
    photoURL: d.photoURL ?? d.photoUrl,
    createdAt: d.createdAt instanceof Timestamp
      ? d.createdAt.toDate()
      : d.dateInscription
        ? new Date(d.dateInscription)
        : new Date(),
  };
};
