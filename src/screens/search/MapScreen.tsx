import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchStackParamList } from '../../navigation/types';
import { Item } from '../../types';
import { useLocation } from '../../hooks/useLocation';
import { getCityCoords } from '../../utils/cityCoordinates';
import { toMockItem } from '../../utils/itemHelpers';
import { getAllItemsWithRatings } from '../../services/firestoreService';
import SmartImage from '../../components/SmartImage';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from '../../theme/theme';

const AGADIR = { latitude: 30.4278, longitude: -9.5981 };
const INITIAL_DELTA = { latitudeDelta: 4, longitudeDelta: 4 };
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.52;

type NavProp = StackNavigationProp<SearchStackParamList, 'MapScreen'>;

interface CityGroup {
  ville: string;
  latitude: number;
  longitude: number;
  items: Item[];
}

export default function MapScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const { location } = useLocation();
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  // sheetCity drives the sheet content; null = sheet closed (possibly mid-animation)
  const [sheetCity, setSheetCity] = useState<CityGroup | null>(null);

  useEffect(() => {
    getAllItemsWithRatings().then((items) => {
      const grouped = new Map<string, Item[]>();
      for (const item of items) {
        const list = grouped.get(item.ville) ?? [];
        list.push(item);
        grouped.set(item.ville, list);
      }
      const groups: CityGroup[] = [];
      grouped.forEach((cityItems, ville) => {
        const coords = getCityCoords(ville);
        if (coords) {
          groups.push({ ville, latitude: coords.lat, longitude: coords.lng, items: cityItems });
        } else {
          const fallback = cityItems.find(i => i.latitude != null && i.longitude != null);
          if (fallback) {
            groups.push({ ville, latitude: fallback.latitude!, longitude: fallback.longitude!, items: cityItems });
          } else {
            console.warn(`[MapScreen] No coords for ville: "${ville}" — skipped`);
          }
        }
      });
      console.log(`[MapScreen] cityGroups: ${groups.length}`, groups.map(g => g.ville));
      setCityGroups(groups);
      setLoading(false);
    });
  }, []);

  const center = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : AGADIR;

  const initialRegion: Region = { ...center, ...INITIAL_DELTA };

  function recenter() {
    mapRef.current?.animateToRegion({ ...center, ...INITIAL_DELTA }, 400);
  }

  // Slide sheet up
  function openSheet(group: CityGroup) {
    setSheetCity(group);
    slideAnim.setValue(SHEET_HEIGHT);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }

  // Slide sheet down, then unmount
  function closeSheet() {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setSheetCity(null));
  }

  const renderCard = useCallback(
    ({ item }: { item: Item }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          closeSheet();
          setTimeout(() => navigation.navigate('ItemDetail', { item: toMockItem(item) }), 260);
        }}
      >
        <SmartImage uri={item.photoUrl} style={styles.cardImage} resizeMode="cover" />
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
        <Text style={styles.cardPrice}>{item.prixParJour} <Text style={styles.cardPriceUnit}>MAD/j</Text></Text>
        <View style={styles.cardBtn}>
          <Text style={styles.cardBtnText}>Voir</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carte</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => sheetCity && closeSheet()}
      >
        <UrlTile
          urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {cityGroups.map((group) => (
          <Marker
            key={group.ville}
            coordinate={{ latitude: group.latitude, longitude: group.longitude }}
            // onPress on Marker is the primary handler
            onPress={() => openSheet(group)}
            // tracksViewChanges: true only for selected city so the ring updates;
            // false for all others to avoid performance issues
            tracksViewChanges={sheetCity?.ville === group.ville}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {/*
              TouchableOpacity inside the Marker is the fallback handler.
              It solves Android elevation / touch-intercept issues on custom views.
              No elevation/shadow on the View itself to avoid Android touch conflicts.
            */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => openSheet(group)}
              style={styles.markerWrapper}
            >
              <View style={[
                styles.markerCircle,
                sheetCity?.ville === group.ville && styles.markerCircleActive,
              ]}>
                <Text style={styles.markerCount}>{group.items.length}</Text>
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>{group.ville}</Text>
            </TouchableOpacity>
          </Marker>
        ))}
      </MapView>

      {/* Bouton recentrer */}
      <TouchableOpacity
        style={[styles.recenterBtn, { top: insets.top + 72 }]}
        onPress={recenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Chargement */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* État vide */}
      {!loading && cityGroups.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun objet localisé</Text>
          </View>
        </View>
      )}

      {/* Bottom sheet — animated slide-up */}
      {sheetCity && (
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 12 },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* Header ville */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.sheetCity}>{sheetCity.ville}</Text>
              <Text style={styles.sheetDash}> — </Text>
              <Text style={styles.sheetCount}>
                {sheetCity.items.length} objet{sheetCity.items.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeSheet}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Liste horizontale */}
          <FlatList
            data={sheetCity.items}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
            style={styles.cardListContainer}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontDisplay,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerSpacer: { width: 40 },

  // Map
  map: { flex: 1 },

  // Marker — NO elevation/shadow on the View to avoid Android touch conflicts
  markerWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow iOS only (no elevation — elevation breaks Android touch on custom markers)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerCircleActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: Colors.textInverse,
  },
  markerCount: {
    fontFamily: Typography.fontDisplay,
    fontSize: 14,
    color: Colors.textInverse,
  },
  markerLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: 11,
    color: Colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    maxWidth: 80,
    textAlign: 'center',
  },

  // Recentrer
  recenterBtn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },

  // Chargement
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,250,248,0.6)',
  },

  // État vide
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 120,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  emptyText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetCity: {
    fontFamily: Typography.fontDisplay,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  sheetDash: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textTertiary,
  },
  sheetCount: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Horizontal card list
  cardListContainer: {
    flexGrow: 0,
  },
  cardList: {
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },

  // Item card
  card: {
    width: 140,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'flex-start',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: 124,
    height: 80,
    borderRadius: 12,
  },
  cardTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  cardPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 14,
    color: Colors.primary,
  },
  cardPriceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  cardBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 5,
    alignItems: 'center',
    marginTop: 2,
  },
  cardBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 12,
    color: Colors.textInverse,
  },
});
