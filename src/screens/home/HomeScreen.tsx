import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import StarRating from '../../components/StarRating';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getCurrentUser } from '../../services/authService';
import { getAllItemsWithRatings, getItemsByCategoryWithRatings, getUserBadges, getUserById, UserBadges } from '../../services/firestoreService';
import { useFavorite } from '../../hooks/useFavorite';
import { useLocation } from '../../hooks/useLocation';
import { auth } from '../../config/firebase.config';
import { Item } from '../../types';
import { toMockItem } from '../../utils/itemHelpers';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';
import { HomeStackParamList } from '../../navigation/types';
import AIAssistant from '../../components/AIAssistant';

type HomeNavProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const ALL_CHIP = { id: 'tout', label: 'Tout', icon: 'apps-outline', color: Colors.primary } as const;
const CHIPS = [ALL_CHIP, ...Categories] as const;


// ─── ItemCard ─────────────────────────────────────────────────

interface ItemCardProps {
  item: Item;
  cardWidth: number;
  onPress: () => void;
}

function ItemCard({ item, cardWidth, onPress }: ItemCardProps) {
  const { isFav, toggle } = useFavorite(item.id);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <SmartImage
          uri={item.photoUrl}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.heartButton} activeOpacity={0.8} onPress={toggle}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? Colors.error : Colors.textTertiary}
          />
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

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {item.prixParJour} MAD
            <Text style={styles.cardPriceUnit}> /jour</Text>
          </Text>
          {(item.averageRating ?? 0) > 0 && (
            <StarRating value={item.averageRating!} size={11} showCount count={item.reviewsCount} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();

  const [activeCategory, setActiveCategory] = useState<string>('tout');
  const [items, setItems] = useState<Item[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [badges, setBadges] = useState<UserBadges>({ pendingRequestsCount: 0, unreadMessagesCount: 0 });
  const [userVille, setUserVille] = useState('');

  const { location } = useLocation();
  const firebaseUser = getCurrentUser();
  const prenom = firebaseUser?.displayName?.split(' ')[0] ?? 'toi';

  const displayVille = userVille || location?.city || 'Agadir';

  const loadItems = useCallback(async () => {
    const result = activeCategory === 'tout'
      ? await getAllItemsWithRatings()
      : await getItemsByCategoryWithRatings(activeCategory);
    setItems(result);
    setIsInitialLoad(false);
  }, [activeCategory]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      const uid = auth.currentUser?.uid;
      if (uid) {
        getUserBadges(uid).then(setBadges);
        getUserById(uid).then((profile) => {
          if (profile?.ville) setUserVille(profile.ville);
        });
      }
    }, [loadItems])
  );

  const cardWidth = useMemo(() => {
    const totalPadding = Layout.screenPadding * 2;
    const totalGap = Layout.cardGap;
    return (screenWidth - totalPadding - totalGap) / 2;
  }, [screenWidth]);

  // Items filtrés par ville du user ; si aucun résultat → tous les items
  const nearbyItems = useMemo(() => {
    if (!userVille) return [];
    const q = userVille.toLowerCase().trim();
    return items.filter((i) => i.ville.toLowerCase().trim() === q);
  }, [items, userVille]);

  const displayedItems = nearbyItems.length > 0 ? nearbyItems : items;
  const sectionLabel = nearbyItems.length > 0 ? 'Près de vous' : 'Objets disponibles';

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemCard
        item={item}
        cardWidth={cardWidth}
        onPress={() => navigation.navigate('ItemDetail', { item: toMockItem(item) })}
      />
    ),
    [cardWidth, navigation],
  );

  const ListHeader = (
    <>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour, {prenom} !</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.locationText}>{displayVille}, Maroc</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={22} color={Colors.textPrimary} />
            {badges.unreadMessagesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badges.unreadMessagesCount > 9 ? '9+' : badges.unreadMessagesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {badges.pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badges.pendingRequestsCount > 9 ? '9+' : badges.pendingRequestsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Barre de recherche ── */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => (navigation as any).navigate('Recherche', { screen: 'SearchScreen' })}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Rechercher un objet...</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.85}
          onPress={() => (navigation as any).navigate('Recherche', { screen: 'SearchScreen', params: { openFilters: true } })}
        >
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
        style={{ overflow: 'visible' }}
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
        <Text style={styles.sectionTitle}>{sectionLabel}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('Recherche')}
        >
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isInitialLoad) {
    return (
      <View style={styles.root}>
        {ListHeader}
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        <AIAssistant items={[]} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun objet disponible</Text>
          </View>
        }
      />
      <AIAssistant items={items} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 160,
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: Typography.fontBodyMedium,
    lineHeight: 14,
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
  searchPlaceholder: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
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
    paddingVertical: 4,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1.5,
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
  cardFooter: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
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

  // ── État chargement ──
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.textSecondary,
  },
});
