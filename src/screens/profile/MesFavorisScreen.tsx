import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getItemById } from '../../services/firestoreService';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useFavorite } from '../../hooks/useFavorite';
import { Item } from '../../types';
import { MockItem } from '../../data/mockItems';
import { Colors, Typography, Spacing, Radius, Shadows, Layout } from '../../theme/theme';
import { ProfileStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<ProfileStackParamList, 'MesFavoris'>;

function toMockItem(item: Item): MockItem {
  return {
    id: item.id,
    titre: item.titre,
    categorie: item.categorie.toLowerCase(),
    ville: item.ville,
    prixParJour: item.prixParJour,
    disponible: item.actif,
    distance: 0,
    images: item.images && item.images.length > 0 ? item.images : item.photoUrl ? [item.photoUrl] : [],
    note: 0,
    avis: 0,
    proprietaire: item.proprietaire ?? { nom: 'Propriétaire', initiales: '?' },
    proprietaireId: item.proprietaireId ?? item.ownerId,
    description: item.description,
    periodeMin: item.periodeMin,
  };
}

// ─── FavCard ──────────────────────────────────────────────────

function FavCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const { isFav, toggle } = useFavorite(item.id);
  const image = item.images && item.images.length > 0 ? item.images[0] : item.photoUrl;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <SmartImage uri={image} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location" size={12} color={Colors.primary} />
          <Text style={styles.cardMetaText}>{item.ville}</Text>
        </View>
        <Text style={styles.cardPrice}>
          {item.prixParJour} MAD
          <Text style={styles.cardPriceUnit}> /jour</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={toggle} activeOpacity={0.8}>
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={20}
          color={isFav ? Colors.error : Colors.textTertiary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function MesFavorisScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { favoriteIds } = useFavorites();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-hydrate whenever the favoriteIds set changes
  useEffect(() => {
    const ids = Array.from(favoriteIds);
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(ids.map((id) => getItemById(id).catch(() => null)))
      .then((results) => {
        const valid = results.filter(
          (item): item is Item => item !== null && item.actif !== false,
        );
        setItems(valid);
      })
      .finally(() => setLoading(false));
  }, [favoriteIds]);

  function openItem(item: Item) {
    (navigation as any).getParent()?.navigate('Home', {
      screen: 'ItemDetail',
      params: { item: toMockItem(item) },
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes favoris</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptySubtitle}>
            Tapez sur le cœur d'un objet pour l'ajouter ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <FavCard item={item} onPress={() => openItem(item)} />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.sm * Typography.lineHeight.relaxed,
  },
  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Typography.fontSubheading,
    fontSize: Typography.size.sm + 1,
    color: Colors.textPrimary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetaText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  cardPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  cardPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Shadows.sm,
  },
});
