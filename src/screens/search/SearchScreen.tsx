import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Slider from '@react-native-community/slider';
import { getAllItemsWithRatings } from '../../services/firestoreService';
import StarRating from '../../components/StarRating';
import { Item } from '../../types';
import { MockItem } from '../../data/mockItems';
import { SearchStackParamList } from '../../navigation/types';

function toMockItem(item: Item): MockItem {
  return {
    id: item.id,
    titre: item.titre,
    categorie: item.categorie.toLowerCase(),
    ville: item.ville,
    prixParJour: item.prixParJour,
    disponible: item.actif,
    distance: 0,
    images: (item.images && item.images.length > 0) ? item.images : (item.photoUrl ? [item.photoUrl] : []),
    note: 0,
    avis: 0,
    proprietaire: item.proprietaire ?? { nom: 'Propriétaire', initiales: '?' },
    proprietaireId: item.proprietaireId ?? item.ownerId,
    description: item.description,
    periodeMin: item.periodeMin,
  };
}
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';

type SearchNavProp = StackNavigationProp<SearchStackParamList, 'SearchScreen'>;

// ─── Types ────────────────────────────────────────────────────

type SortOption = 'proximite' | 'prix' | 'note';

interface Filters {
  prixMax: number;
  distanceMax: number;
  noteMin: number;
}

const NOTE_CHIPS: { label: string; value: number }[] = [
  { label: 'Toutes', value: 0 },
  { label: '★ 3+', value: 3 },
  { label: '★ 4+', value: 4 },
  { label: '★ 4.5+', value: 4.5 },
  { label: '★ 4.8+', value: 4.8 },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'proximite', label: 'À proximité' },
  { id: 'prix', label: 'Prix' },
  { id: 'note', label: 'Note' },
];

const DEFAULT_FILTERS: Filters = { prixMax: 200, distanceMax: 3, noteMin: 0 };

const ALL_CHIP = { id: 'tout', label: 'Tout', icon: 'apps-outline', color: Colors.primary } as const;
const CATEGORY_CHIPS = [ALL_CHIP, ...Categories] as const;

// ─── ItemRow ──────────────────────────────────────────────────

function ItemRow({ item, onPress }: { item: Item; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.itemRow} activeOpacity={0.7} onPress={onPress}>
      <SmartImage uri={item.photoUrl} style={styles.itemImage} resizeMode="cover" />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.titre}</Text>
        <View style={styles.itemMeta}>
          <Ionicons name="location" size={12} color={Colors.textSecondary} />
          <Text style={styles.itemMetaText}>{item.ville}</Text>
        </View>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>{item.prixParJour} MAD</Text>
          <Text style={styles.itemPriceUnit}>/j</Text>
        </View>
        {(item.averageRating ?? 0) > 0 && (
          <View style={styles.itemRatingRow}>
            <StarRating value={item.averageRating!} size={12} showCount count={item.reviewsCount} />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavProp>();
  const route = useRoute<any>();
  const inputRef = useRef<TextInput>(null);

  const canGoBack = navigation.canGoBack();
  const openFiltersParam: boolean = route?.params?.openFilters ?? false;

  const [allItems, setAllItems] = useState<Item[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('tout');
  const [activeSort, setActiveSort] = useState<SortOption>('proximite');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getAllItemsWithRatings().then((result) => {
        console.log('[SearchScreen] Total items loaded:', result.length);
        setAllItems(result);
        setIsInitialLoad(false);
      });
    }, [])
  );

  useEffect(() => {
    if (openFiltersParam) setShowFilters(true);
  }, [openFiltersParam]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...allItems];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.titre.toLowerCase().includes(q));
    }
    if (activeCategory !== 'tout') {
      items = items.filter((i) => i.categorie.toLowerCase() === activeCategory);
    }
    items = items.filter((i) => i.prixParJour <= filters.prixMax);
    if (filters.noteMin > 0) {
      items = items.filter((i) => (i.averageRating ?? 0) >= filters.noteMin);
    }
    if (activeSort === 'prix') items.sort((a, b) => a.prixParJour - b.prixParJour);
    else if (activeSort === 'note') {
      items.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    } else {
      items.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());
    }
    console.log('[SearchScreen] noteMin filter:', filters.noteMin, '— After filters:', items.length);
    return items;
  }, [search, activeCategory, activeSort, filters, allItems]);

  const pendingCount = useMemo(() => {
    let items = [...allItems];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.titre.toLowerCase().includes(q));
    }
    if (activeCategory !== 'tout') {
      items = items.filter((i) => i.categorie.toLowerCase() === activeCategory);
    }
    items = items.filter((i) => i.prixParJour <= pendingFilters.prixMax);
    if (pendingFilters.noteMin > 0) {
      items = items.filter((i) => (i.averageRating ?? 0) >= pendingFilters.noteMin);
    }
    return items.length;
  }, [search, activeCategory, pendingFilters, allItems]);

  function openModal() {
    setPendingFilters(filters);
    setShowFilters(true);
  }

  function applyFilters() {
    setFilters(pendingFilters);
    setShowFilters(false);
  }

  function resetFilters() {
    setPendingFilters(DEFAULT_FILTERS);
  }

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemRow item={item} onPress={() => navigation.navigate('ItemDetail', { item: toMockItem(item) })} />
    ),
    [navigation],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header : search bar + filter button */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher un objet..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus={false}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openModal} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Category chips — marginBottom colle directement la stats row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContainer}
      >
        {CATEGORY_CHIPS.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon as any} size={15} color={active ? Colors.textInverse : cat.color} />
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats + Sort — directement après les chips, pas de gap */}
      <View style={styles.statsRow}>
        <Text style={styles.statsCount}>
          <Text style={styles.statsCountNum}>{isInitialLoad ? '–' : filteredItems.length}</Text> objets disponibles
        </Text>
        <View style={styles.sortChips}>
          {SORT_OPTIONS.map((s) => {
            const active = activeSort === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => setActiveSort(s.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sortChipLabel, active && styles.sortChipLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Results — flex: 1 pour remplir l'espace restant sans créer de gap */}
      {isInitialLoad ? (
        <View style={styles.isInitialLoadState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun objet disponible</Text>
              <Text style={styles.emptySubtitle}>Essayez d'autres mots-clés ou filtres</Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setFilters(DEFAULT_FILTERS);
                  setActiveCategory('tout');
                  setSearch('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyResetText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bouton Carte : absolute, ne pousse aucun élément */}
      <TouchableOpacity
        style={styles.mapBtn}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert('Bientôt disponible', 'La vue carte sera disponible prochainement.', [{ text: 'OK' }])
        }
      >
        <Ionicons name="map-outline" size={20} color={Colors.textInverse} />
        <Text style={styles.mapBtnText}>Carte</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setShowFilters(false)} activeOpacity={1} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Title row */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Prix max */}
            <View style={styles.filterSection}>
              <View style={styles.filterLabelRow}>
                <Text style={styles.filterLabel}>Prix max</Text>
                <Text style={styles.filterValue}>{pendingFilters.prixMax} MAD/j</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={500}
                step={10}
                value={pendingFilters.prixMax}
                onValueChange={(v) => setPendingFilters((prev) => ({ ...prev, prixMax: v }))}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
            </View>

            {/* Distance max */}
            <View style={styles.filterSection}>
              <View style={styles.filterLabelRow}>
                <Text style={styles.filterLabel}>Distance max</Text>
                <Text style={styles.filterValue}>{pendingFilters.distanceMax} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={pendingFilters.distanceMax}
                onValueChange={(v) => setPendingFilters((prev) => ({ ...prev, distanceMax: v }))}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
            </View>

            {/* Note minimale */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Note minimale</Text>
              <View style={styles.noteChips}>
                {NOTE_CHIPS.map((n) => {
                  const active = pendingFilters.noteMin === n.value;
                  return (
                    <TouchableOpacity
                      key={n.value}
                      style={[styles.noteChip, active && styles.noteChipActive]}
                      onPress={() => setPendingFilters((prev) => ({ ...prev, noteMin: n.value }))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.noteChipLabel, active && styles.noteChipLabelActive]}>
                        {n.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters} activeOpacity={0.8}>
                <Text style={styles.resetBtnText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, pendingCount === 0 && { opacity: 0.6 }]}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>
                  {pendingCount === 0
                    ? 'Aucun résultat'
                    : `Voir ${pendingCount} résultat${pendingCount > 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchBar: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  searchBarFull: {
    marginLeft: 0,
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
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },

  // Category chips
  chipsScroll: {
    marginTop: 16,
    marginBottom: 12,
    flexGrow: 0,
    overflow: 'visible',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    gap: 5,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipLabel: { fontFamily: Typography.fontBodyMedium, fontSize: 13 },
  chipLabelActive: { color: Colors.textInverse },
  chipLabelInactive: { color: Colors.textSecondary },

  // Stats + Sort
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statsCount: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsCountNum: {
    fontFamily: Typography.fontHeading,
    color: Colors.textPrimary,
  },
  sortChips: {
    flexDirection: 'row',
    gap: 4,
  },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sortChipActive: {
    backgroundColor: Colors.primaryXLight,
  },
  sortChipLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sortChipLabelActive: {
    fontFamily: Typography.fontBodyMedium,
    color: Colors.primary,
  },

  // FlatList + content
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 12,
  },

  // Loading state
  isInitialLoadState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Item row card
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  itemMetaText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 16,
    color: Colors.primary,
  },
  itemPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  itemRatingRow: {
    marginTop: 3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyResetBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
  emptyResetText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.primary,
  },

  // Floating map button — absolute, ne pousse rien
  mapBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    left: '25%',
    right: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing['2xl'],
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mapBtnText: {
    fontFamily: Typography.fontSubheading,
    fontSize: 15,
    color: Colors.textInverse,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing['2xl'],
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
  },

  // Filter sections
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterValue: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 4,
  },
  noteChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  noteChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  noteChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  noteChipLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  noteChipLabelActive: {
    color: Colors.textInverse,
  },

  // Sheet buttons
  sheetButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  resetBtn: {
    flex: 4,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 6,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  applyBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textInverse,
  },
});
