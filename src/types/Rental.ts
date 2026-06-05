// États possibles d'une demande de location
export enum StatutDemande {
  PENDING = 'PENDING',           // En attente
  ACCEPTED = 'ACCEPTED',         // Acceptée, en attente de remise
  IN_PROGRESS = 'IN_PROGRESS',   // Remis au locataire, location en cours
  REJECTED = 'REJECTED',         // Refusée
  CANCELLED = 'CANCELLED',       // Annulée
  COMPLETED = 'COMPLETED',       // Rendu et confirmé, terminée
}

// Type pour une demande de location
export interface Rental {
  id: string;
  itemId: string;
  itemTitre: string;
  itemImage: string;
  locataireId: string;
  proprietaireId: string;
  dateDebut: Date;
  dateFin: Date;
  jours: number;
  prixTotal: number;
  message: string;
  statut: StatutDemande;

  // Workflow remise
  remiseProprio?: boolean;
  remiseLocataire?: boolean;
  remiseAt?: Date;

  // Workflow retour
  retourLocataire?: boolean;
  retourProprio?: boolean;
  retourAt?: Date;

  createdAt: Date;
  updatedAt?: Date;
}

// Type pour créer une demande
export interface CreateRentalData {
  itemId: string;
  dateDebut: Date;
  dateFin: Date;
}