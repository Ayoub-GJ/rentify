import { useFavorites } from '../contexts/FavoritesContext';

export function useFavorite(itemId: string) {
  const { isFavorite, toggleFavorite } = useFavorites();
  return {
    isFav: isFavorite(itemId),
    toggle: () => toggleFavorite(itemId),
    loading: false,
  };
}
