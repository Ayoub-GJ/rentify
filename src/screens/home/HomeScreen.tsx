import React, { useState, useCallback, useMemo } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../services/authService';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';

// ─── Types ───────────────────────────────────────────────────
// TODO: Ajouter badge vérifié sur profil (Phase 4)

interface MockItem {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  prixParJour: number;
  disponible: boolean;
  images: string[];
  note: number;
  avis: number;
}

// ─── Données mock ─────────────────────────────────────────────

const MOCK_ITEMS: MockItem[] = [
  {
    id: '1',
    titre: 'Perceuse Bosch GSB 18V',
    categorie: 'outils',
    ville: 'Agadir',
    prixParJour: 25,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400'],
    note: 4.9,
    avis: 32,
  },
  {
    id: '2',
    titre: 'Appareil Photo Sony A7 III',
    categorie: 'photo',
    ville: 'Agadir',
    prixParJour: 80,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'],
    note: 4.8,
    avis: 18,
  },
  {
    id: '3',
    titre: 'Vélo VTT Trek Marlin',
    categorie: 'sport',
    ville: 'Agadir',
    prixParJour: 35,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400'],
    note: 4.7,
    avis: 24,
  },
  {
    id: '4',
    titre: 'Tondeuse Bosch Rotak',
    categorie: 'jardinage',
    ville: 'Agadir',
    prixParJour: 20,
    disponible: true,
    images: ['https://source.unsplash.com/Su0SedcyOkQ/400x300'],
    note: 4.6,
    avis: 11,
  },
  {
    id: '5',
    titre: 'MacBook Pro 14" M3',
    categorie: 'informatique',
    ville: 'Agadir',
    prixParJour: 120,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    note: 5.0,
    avis: 7,
  },
  {
    id: '6',
    titre: 'Tente Camping Quechua',
    categorie: 'sport',
    ville: 'Agadir',
    prixParJour: 30,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400'],
    note: 4.5,
    avis: 15,
  },
  {
    id: '7',
    titre: 'Sono JBL Xtreme 3',
    categorie: 'evenement',
    ville: 'Agadir',
    prixParJour: 45,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
    note: 4.8,
    avis: 29,
  },
  {
    id: '8',
    titre: 'Karcher Nettoyeur HP',
    categorie: 'maison',
    ville: 'Agadir',
    prixParJour: 40,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'],
    note: 4.4,
    avis: 8,
  },
];

const ALL_CHIP = { id: 'tout', label: 'Tout', icon: 'apps-outline', color: Colors.primary } as const;
const CHIPS = [ALL_CHIP, ...Categories] as const;

// ─── ItemCard ─────────────────────────────────────────────────

interface ItemCardProps {
  item: MockItem;
  cardWidth: number;
}

function ItemCard({ item, cardWidth }: ItemCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.88}
      onPress={() => console.log(item.id)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.images[0] }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.heartButton} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.titre}
        </Text>

        <View style={styles.cardLocation}>
          <Ionicons name="location" size={11} color={Colors.primary} />
          <Text style={styles.cardLocationText}>{item.ville}</Text>
        </View>

        <View style={styles.cardRating}>
          <Ionicons name="star" size={12} color="#F0A020" />
          <Text style={styles.cardRatingNote}>{item.note}</Text>
          <Text style={styles.cardRatingAvis}>({item.avis} avis)</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {item.prixParJour} MAD
            <Text style={styles.cardPriceUnit}> /jour</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('tout');

  const firebaseUser = getCurrentUser();
  const prenom = firebaseUser?.displayName?.split(' ')[0] ?? 'Ayoub';

  const filteredItems = useMemo(() => {
    const byCategory =
      activeCategory === 'tout'
        ? MOCK_ITEMS
        : MOCK_ITEMS.filter((i) => i.categorie === activeCategory);

    if (!searchQuery.trim()) return byCategory;
    const q = searchQuery.toLowerCase();
    return byCategory.filter(
      (i) => i.titre.toLowerCase().includes(q) || i.categorie.toLowerCase().includes(q),
    );
  }, [activeCategory, searchQuery]);

  const cardWidth = useMemo(() => {
    const totalPadding = Layout.screenPadding * 2;
    const totalGap = Layout.cardGap;
    return (screenWidth - totalPadding - totalGap) / 2;
  }, [screenWidth]);

  const renderItem = useCallback(
    ({ item }: { item: MockItem }) => <ItemCard item={item} cardWidth={cardWidth} />,
    [cardWidth],
  );

  const ListHeader = (
    <>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour, {prenom} !</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.locationText}>Agadir, Maroc</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Barre de recherche ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un objet..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* ── Catégories ── */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Catégories</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {CHIPS.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={isActive ? Colors.textInverse : cat.color}
              />
              <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : styles.chipLabelInactive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Titre section items ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Près de vous</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun objet trouvé</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing['4xl'],
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    gap: Spacing.xs,
  },
  greeting: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // ── Recherche ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchBar: {
    flex: 1,
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    ...Shadows.sm,
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
  filterButton: {
    width: Layout.inputHeight,
    height: Layout.inputHeight,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },

  // ── Chips catégories ──
  sectionTitleRow: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  chipsContainer: {
    paddingHorizontal: Layout.screenPadding - Spacing.xs,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg - Spacing.xs,
    gap: Spacing.xs,
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

  // ── En-tête section items ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm + 1,
    color: Colors.primary,
  },

  // ── Grille ──
  columnWrapper: {
    paddingHorizontal: Layout.screenPadding,
    gap: Layout.cardGap,
    marginBottom: Layout.cardGap,
  },

  // ── Card item ──
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
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLocationText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  cardFooter: {
    marginTop: Spacing.xs,
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

  // ── État vide ──
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
});
