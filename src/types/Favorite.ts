export interface Favorite {
  id: string;        // format: "uid_itemId"
  userId: string;
  itemId: string;
  createdAt: Date;
}
