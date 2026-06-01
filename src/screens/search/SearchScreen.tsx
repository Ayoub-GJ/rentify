import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';
import { MOCK_ITEMS, MockItem } from '../../data/items';

// ─── Types ────────────────────────────────────────────────────

type QuickFilter = 'tout' | 'disponible' | 'moins50' | 'pres';

interface QuickFilterChip {
  id: QuickFilter;
  label: string;
}

const QUICK_FILTERS: QuickFilterChip[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'disponible', label: 'Disponible' },
  { id: 'moins50', label: '< 50 MAD' },
  { id: 'pres', label: 'Près de moi' },
];

// ─── ItemCard ─────────────────────────────────────────────────

function ItemCard({ item, cardWidth }: { item: MockItem; cardWidth: number }) {
  return (
    <TouchableOpacity style={[styles.card, { width: cardWidth }]} activeOpacity={0.88}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
        <TouchableOpacity style={styles.heartButton} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
        <View style={styles.cardRow}>
          <Ionicons name="location" size={11} color={Colors.primary} />
          <Text style={styles.cardLocationText}>{item.ville}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="star" size={12} color="#F0A020" />
          <Text style={styles.cardRatingNote}>{item.note}</Text>
          <Text style={styles.cardRatingAvis}>({item.avis} avis)</Text>
        </View>
        <Text style={styles.cardPrice}>
          {item.prixParJour} MAD<Text style={styles.cardPriceUnit}> /jour</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────

function CategoryCard({
  cat,
  cardWidth,
  onPress,
}: {
  cat: (typeof Categories)[number];
  cardWidth: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.catCard, { width: cardWidth }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Ionicons name={cat.icon as any} size={32} color={cat.color} />
      <Text style={styles.catLabel}>{cat.label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function SearchScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('tout');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isSearching = query.trim().length > 0 || activeCategory !== null || quickFilter !== 'tout';

  const filteredItems = useMemo(() => {
    let items = MOCK_ITEMS;

    if (activeCategory) {
      items = items.filter((i) => i.categorie === activeCategory);
    }

    if (quickFilter === 'disponible') items = items.filter((i) => i.disponible);
    if (quickFilter === 'moins50') items = items.filter((i) => i.prixParJour < 50);

    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.titre.toLowerCase().includes(q) ||
          i.categorie.toLowerCase().includes(q) ||
          i.ville.toLowerCase().includes(q),
      );
    }

    return items;
  }, [query, quickFilter, activeCategory]);

  const cardWidth = useMemo(() => {
    const totalPadding = Layout.screenPadding * 2;
    return (screenWidth - totalPadding - Layout.cardGap) / 2;
  }, [screenWidth]);

  const catCardWidth = useMemo(() => {
    const totalPadding = Layout.screenPadding * 2;
    return (screenWidth - totalPadding - Spacing.md) / 2;
  }, [screenWidth]);

  function handleCategoryPress(catId: string) {
    setActiveCategory(catId);
  }

  function handleCancel() {
    setQuery('');
    setFocused(false);
    setActiveCategory(null);
    setQuickFilter('tout');
    inputRef.current?.blur();
  }

  const renderItem = useCallback(
    ({ item }: { item: MockItem }) => <ItemCard item={item} cardWidth={cardWidth} />,
    [cardWidth],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>Trouvez l'objet parfait</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher un objet..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={false}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {focused && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {QUICK_FILTERS.map((f) => {
          const active = quickFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              onPress={() => setQuickFilter(f.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isSearching ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun objet trouvé</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={Categories as unknown as (typeof Categories)[number][]}
          keyExtractor={(cat) => cat.id}
          renderItem={({ item: cat }) => (
            <CategoryCard
              cat={cat}
              cardWidth={catCardWidth}
              onPress={() => handleCategoryPress(cat.id)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.catColumnWrapper}
          contentContainerStyle={styles.catListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Catégories</Text>
          }
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

  // Header
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchBar: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchBarFocused: {
    borderColor: Colors.primary,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 15,
    color: Colors.primary,
  },

  // Quick filters
  chips: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    height: 36,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
  },
  chipLabelActive: {
    color: Colors.textInverse,
  },
  chipLabelInactive: {
    color: Colors.textSecondary,
  },

  // Results list
  resultCount: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.md,
  },
  columnWrapper: {
    paddingHorizontal: Layout.screenPadding,
    gap: Layout.cardGap,
    marginBottom: Layout.cardGap,
  },
  listContent: {
    paddingBottom: Spacing['4xl'],
  },

  // Item card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 130,
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Typography.fontSubheading,
    fontSize: Typography.size.sm + 1,
    color: Colors.textPrimary,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLocationText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  cardRatingNote: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  cardRatingAvis: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  cardPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.md,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  cardPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['6xl'],
    gap: Spacing.lg,
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
  },

  // Categories grid
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.md,
  },
  catColumnWrapper: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  catListContent: {
    paddingBottom: Spacing['4xl'],
  },
  catCard: {
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  catLabel: {
    fontFamily: Typography.fontSubheading,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});
