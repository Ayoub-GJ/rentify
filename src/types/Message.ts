export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  texte: string;
  imageUrl?: string;
  createdAt: Date;
  lu: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  itemId: string;
  itemTitre: string;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
}
