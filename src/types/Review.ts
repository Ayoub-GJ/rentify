export interface Review {
  id: string;
  rentalId: string;
  itemId: string;
  itemTitre: string;
  proprietaireId: string;
  locataireId: string;
  locataireName: string;
  rating: number;
  commentaire: string;
  createdAt: Date;
}
