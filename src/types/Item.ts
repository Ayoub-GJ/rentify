// Catégories d'objets (énumération)
export enum Categorie {
  ELECTROMENAGER = 'ELECTROMENAGER',
  BRICOLAGE = 'BRICOLAGE',
  JARDINAGE = 'JARDINAGE',
  SPORT = 'SPORT',
  MULTIMEDIA = 'MULTIMEDIA',
  MOBILIER = 'MOBILIER',
  AUTRE = 'AUTRE',
}

// Type pour un objet à louer
export interface Item {
  id: string;                    // ID unique de l'objet
  titre: string;                 // Titre de l'annonce
  description: string;           // Description détaillée
  categorie: Categorie;          // Catégorie de l'objet
  prixParJour: number;           // Prix par jour en MAD
  ville: string;                 // Ville où se trouve l'objet
  photoUrl: string;              // URL de la première photo (dénormalisé)
  images?: string[];             // Tableau de toutes les photos
  ownerId: string;               // ID du propriétaire (legacy)
  proprietaireId?: string;       // ID du propriétaire (nouveau format)
  proprietaire?: { nom: string; initiales: string }; // Infos affichage
  actif: boolean;                // Objet disponible ou non
  datePublication: Date;         // Date de publication
  periodeMin?: number;           // Durée minimum de location en jours (1 par défaut)
  averageRating?: number;        // Moyenne des avis (0-5)
  reviewsCount?: number;         // Nombre d'avis
  latitude?: number;             // Coordonnées GPS
  longitude?: number;
}

// Type pour créer un nouvel objet
export interface CreateItemData {
  titre: string;
  description: string;
  categorie: Categorie;
  prixParJour: number;
  ville: string;
  photo: string;                 // Image en base64 ou URI
}