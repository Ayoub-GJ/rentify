// États possibles d'une demande de location
export enum StatutDemande {
  PENDING = 'PENDING',           // En attente
  ACCEPTED = 'ACCEPTED',         // Acceptée
  REJECTED = 'REJECTED',         // Refusée
  CANCELLED = 'CANCELLED',       // Annulée
  COMPLETED = 'COMPLETED',       // Terminée
}

// Type pour une demande de location
export interface Rental {
  id: string;                    // ID unique de la location
  itemId: string;                // ID de l'objet loué
  renterId: string;              // ID du locataire
  ownerId: string;               // ID du propriétaire
  dateDebut: Date;               // Date de début
  dateFin: Date;                 // Date de fin
  prixTotal: number;             // Prix total calculé
  statut: StatutDemande;         // État de la demande
  dateCreation: Date;            // Date de création
}

// Type pour créer une demande
export interface CreateRentalData {
  itemId: string;
  dateDebut: Date;
  dateFin: Date;
}