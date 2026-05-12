// Type pour un message dans une conversation
export interface Message {
  id: string;                    // ID unique du message
  conversationId: string;        // ID de la conversation
  expediteurId: string;          // ID de l'expéditeur
  contenu: string;               // Contenu du message
  dateEnvoi: Date;               // Date d'envoi
  lu: boolean;                   // Message lu ou non
}

// Type pour une conversation
export interface Conversation {
  id: string;                    // ID unique
  rentalId: string;              // ID de la location associée
  participantIds: string[];      // IDs des participants [owner, renter]
  dateCreation: Date;            // Date de création
  dernierMessage?: Date;         // Date du dernier message
}