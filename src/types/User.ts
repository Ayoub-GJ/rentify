export interface User {
  uid: string;
  email: string;
  prenom: string;
  nom: string;
  telephone?: string;
  ville?: string;
  photoURL?: string;
  createdAt: Date;
}

export interface SignupData {
  email: string;
  password: string;
  prenom: string;
  nom?: string;
  telephone?: string;
  ville?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
