// Type pour un utilisateur de l'application
export interface User {
  id: string;                    // ID unique Firebase
  email: string;                 // Email de connexion
  nom: string;                   // Nom de famille
  prenom: string;                // Prénom
  telephone: string;             // Numéro de téléphone
  ville: string;                 // Ville de l'utilisateur
  photoUrl?: string;             // URL photo de profil (optionnel)
  dateInscription: Date;         // Date de création du compte
}

// Type pour les données lors de l'inscription
export interface SignupData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone: string;
  ville: string;
}

// Type pour les données de connexion
export interface LoginData {
  email: string;
  password: string;
}