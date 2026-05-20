import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { User, SignupData, LoginData } from '../types';

/**
 * Inscription d'un nouvel utilisateur
 * 1. Créer le compte Firebase Auth
 * 2. Créer le document utilisateur dans Firestore
 */
export const signup = async (data: SignupData): Promise<User> => {
  try {
    // Créer le compte Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;

    // Créer le profil utilisateur
    const newUser: User = {
      id: firebaseUser.uid,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      ville: data.ville,
      dateInscription: new Date(),
    };

    // Sauvegarder dans Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      dateInscription: new Date().toISOString(), // Firestore aime les strings pour les dates
    });

    return newUser;
  } catch (error: any) {
    console.error('Erreur signup:', error);
    throw new Error(error.message || 'Erreur lors de l\'inscription');
  }
};

/**
 * Connexion d'un utilisateur existant
 */
export const login = async (data: LoginData): Promise<User> => {
  try {
    // Connexion Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const firebaseUser = userCredential.user;

    // Récupérer le profil depuis Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('Profil utilisateur introuvable');
    }

    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      ville: userData.ville,
      photoUrl: userData.photoUrl,
      dateInscription: new Date(userData.dateInscription),
    };
  } catch (error: any) {
    console.error('Erreur login:', error);
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
};

/**
 * Déconnexion
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erreur logout:', error);
    throw new Error(error.message || 'Erreur lors de la déconnexion');
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Récupérer le profil complet de l'utilisateur connecté
 */
export const getCurrentUserProfile = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }

  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data();

  return {
    id: firebaseUser.uid,
    email: userData.email,
    nom: userData.nom,
    prenom: userData.prenom,
    telephone: userData.telephone,
    ville: userData.ville,
    photoUrl: userData.photoUrl,
    dateInscription: new Date(userData.dateInscription),
  };
};