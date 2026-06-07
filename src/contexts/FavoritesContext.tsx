import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import {
  addFavorite as addFav,
  removeFavorite as removeFav,
  getUserFavoriteIds,
} from '../services/firestoreService';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFavoriteIds(new Set());
        setLoading(false);
        return;
      }
      try {
        const ids = await getUserFavoriteIds(user.uid);
        setFavoriteIds(new Set(ids));
      } catch (e) {
        console.error('Load favorites error:', e);
        setFavoriteIds(new Set());
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.has(itemId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      const user = auth.currentUser;
      if (!user) return;

      const wasFavorite = favoriteIds.has(itemId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(itemId);
        else next.add(itemId);
        return next;
      });

      try {
        if (wasFavorite) {
          await removeFav(user.uid, itemId);
        } else {
          await addFav(user.uid, itemId);
        }
      } catch (e) {
        // Rollback on error
        console.error('Toggle favorite error:', e);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
      }
    },
    [favoriteIds],
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
