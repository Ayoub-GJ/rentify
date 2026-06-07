import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect, TabActions } from '@react-navigation/native';
import { auth } from '../../config/firebase.config';
import {
  getRentalsByLocataire,
  getRentalsByProprietaire,
  updateRentalStatus,
  getUserById,
  getItemsByOwner,
  getOrCreateConversation,
  RentalData,
} from '../../services/firestoreService';
import { StatutDemande, Item, User } from '../../types';
import { MockItem } from '../../data/mockItems';
import { LocationsStackParamList } from '../../navigation/types';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  RentalStatusConfig,
} from '../../theme/theme';
import {
  fullName,
  shortName,
  getInitials,
  avatarColorFromUid,
  formatDateRange,
} from '../../utils/formatters';

// ─── Helpers ─────────────────────────────────────────────────

function toMockItem(item: Item): MockItem {
  return {
    id: item.id,
    titre: item.titre,
    categorie: item.categorie,
    ville: item.ville,
    prixParJour: item.prixParJour,
    disponible: item.actif,
    distance: 0,
    images: item.images && item.images.length > 0
      ? item.images
      : item.photoUrl ? [item.photoUrl] : [],
    note: 0,
    avis: 0,
    proprietaire: item.proprietaire ?? { nom: 'Propriétaire', initiales: '?' },
    proprietaireId: item.proprietaireId,
    description: item.description,
    periodeMin: item.periodeMin,
  };
}

// ─── Types ────────────────────────────────────────────────────

type Tab = 'encours' | 'annonces' | 'demandes';
type RentalWithOther = RentalData & { otherUser: User | null };
type NavProp = StackScreenProps<LocationsStackParamList, 'MesLocations'>['navigation'];

// ─── StatusBadge ──────────────────────────────────────────────

function StatusBadge({ statut }: { statut: StatutDemande }) {
  const cfg = RentalStatusConfig[statut];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Tab 1 — LocationCard ─────────────────────────────────────

function LocationCard({
  rental,
  navigation,
}: {
  rental: RentalWithOther;
  navigation: NavProp;
}) {
  const [contacting, setContacting] = useState(false);

  const isPasse =
    rental.statut === StatutDemande.COMPLETED ||
    rental.statut === StatutDemande.CANCELLED ||
    rental.statut === StatutDemande.REJECTED;

  async function handleContact() {
    const uid = auth.currentUser?.uid;
    if (!uid || !rental.proprietaireId) return;
    setContacting(true);
    try {
      const user = await getUserById(rental.proprietaireId);
      const conversationId = await getOrCreateConversation(
        uid,
        rental.proprietaireId,
        rental.itemId,
        rental.itemTitre,
      );
      navigation.navigate('Chat', {
        conversationId,
        itemTitre: rental.itemTitre,
        itemImage: rental.itemImage,
        otherUserName: fullName(user),
      });
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation.');
    } finally {
      setContacting(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, isPasse && { opacity: 0.65 }]}
      onPress={() => navigation.navigate('RentalDetail', { rentalId: rental.id, role: 'locataire' })}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <SmartImage uri={rental.itemImage} style={styles.cardThumb} resizeMode="cover" />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{rental.itemTitre}</Text>
            <StatusBadge statut={rental.statut} />
          </View>
          <Text style={styles.cardDates}>
            {formatDateRange(rental.dateDebut, rental.dateFin)}
          </Text>
          {rental.otherUser && (
            <Text style={styles.cardMeta}>
              par {shortName(rental.otherUser)}
            </Text>
          )}
          <Text style={styles.cardPrice}>{rental.prixTotal} MAD</Text>
        </View>
      </View>

      {(rental.statut === StatutDemande.ACCEPTED || rental.statut === StatutDemande.IN_PROGRESS) && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.btnGreen, contacting && { opacity: 0.6 }]}
            onPress={handleContact}
            disabled={contacting}
            activeOpacity={0.8}
          >
            {contacting
              ? <ActivityIndicator size="small" color={Colors.textInverse} />
              : <Text style={styles.btnGreenText}>Contacter</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Tab 1 — EnCoursTab ───────────────────────────────────────

function EnCoursTab({
  rentals,
  navigation,
}: {
  rentals: RentalWithOther[];
  navigation: NavProp;
}) {
  const active = rentals.filter(
    (r) =>
      r.statut === StatutDemande.PENDING ||
      r.statut === StatutDemande.ACCEPTED ||
      r.statut === StatutDemande.IN_PROGRESS,
  );
  const passees = rentals.filter(
    (r) =>
      r.statut === StatutDemande.COMPLETED ||
      r.statut === StatutDemande.CANCELLED ||
      r.statut === StatutDemande.REJECTED,
  );

  if (rentals.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={52} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>Aucune location en cours</Text>
        <Text style={styles.emptySubtitle}>Vos demandes de location apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {active.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Actives</Text>
          {active.map((r) => (
            <LocationCard key={r.id} rental={r} navigation={navigation} />
          ))}
        </>
      )}
      {passees.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, active.length > 0 && { marginTop: Spacing.xl }]}>
            Passées
          </Text>
          {passees.map((r) => (
            <LocationCard key={r.id} rental={r} navigation={navigation} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Tab 2 — AnnonceCard ──────────────────────────────────────

function AnnonceCard({ item, navigation }: { item: Item; navigation: NavProp }) {
  const imageUri =
    item.images && item.images.length > 0 ? item.images[0] : item.photoUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ItemDetail', { item: toMockItem(item) })}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <SmartImage uri={imageUri} style={styles.cardThumb} resizeMode="cover" />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
            <View style={[styles.badge, { backgroundColor: item.actif ? Colors.acceptedBg : Colors.cancelledBg }]}>
              <Text style={[styles.badgeText, { color: item.actif ? Colors.accepted : Colors.cancelled }]}>
                {item.actif ? 'Actif' : 'Archivée'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardPrice}>{item.prixParJour} MAD/j</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tab 2 — AnnoncesTab ─────────────────────────────────────

function AnnoncesTab({
  items,
  navigation,
}: {
  items: Item[];
  navigation: NavProp;
}) {
  function handleAddItem() {
    (navigation as any).getParent()?.dispatch(TabActions.jumpTo('AddItem'));
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={handleAddItem} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
        <Text style={styles.ctaText}>Mettre un objet en location</Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={52} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucune annonce</Text>
          <Text style={styles.emptySubtitle}>Cliquez sur + pour publier votre premier objet</Text>
        </View>
      ) : (
        items.map((item) => <AnnonceCard key={item.id} item={item} navigation={navigation} />)
      )}
    </ScrollView>
  );
}

// ─── Tab 3 — DemandeCard ──────────────────────────────────────

function DemandeCard({
  rental,
  navigation,
  onAccept,
  onReject,
}: {
  rental: RentalWithOther;
  navigation: NavProp;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const locataire = rental.otherUser;
  const initiales = getInitials(locataire);
  const avatarColor = avatarColorFromUid(rental.locataireId);
  const titre = locataire
    ? `${shortName(locataire)} veut louer`
    : 'Quelqu\'un veut louer';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RentalDetail', { rentalId: rental.id, role: 'proprietaire' })}
      activeOpacity={0.75}
    >
      {/* Header : avatar + nom + badge */}
      <View style={styles.demandeHeader}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initiales}</Text>
        </View>
        <View style={styles.demandeInfo}>
          <Text style={styles.demandeTitre} numberOfLines={1}>{titre}</Text>
          <Text style={styles.demandeObjet} numberOfLines={1}>{rental.itemTitre}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.pendingBg }]}>
          <Text style={[styles.badgeText, { color: Colors.pending }]}>En attente</Text>
        </View>
      </View>

      {/* Message locataire */}
      {!!rental.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>« {rental.message} »</Text>
        </View>
      )}

      {/* Dates + prix */}
      <View style={styles.demandeMeta}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.demandeMetaText}>
          {formatDateRange(rental.dateDebut, rental.dateFin)}
          {' · '}{rental.prixTotal} MAD
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.demandeActions}>
        <TouchableOpacity
          style={styles.btnRefuser}
          onPress={() => onReject(rental.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnRefuserText}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnAccepter}
          onPress={() => onAccept(rental.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          <Text style={styles.btnAccepterText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tab 3 — ActiveDemandeCard (ACCEPTED + IN_PROGRESS) ──────

function ActiveDemandeCard({
  rental,
  navigation,
}: {
  rental: RentalWithOther;
  navigation: NavProp;
}) {
  const [contacting, setContacting] = useState(false);

  const locataire = rental.otherUser;
  const initiales = getInitials(locataire);
  const avatarColor = avatarColorFromUid(rental.locataireId);
  const locataireNom = fullName(locataire);

  async function handleContact() {
    const uid = auth.currentUser?.uid;
    if (!uid || !rental.locataireId) return;
    setContacting(true);
    try {
      const convId = await getOrCreateConversation(
        uid,
        rental.locataireId,
        rental.itemId,
        rental.itemTitre,
      );
      navigation.navigate('Chat', {
        conversationId: convId,
        itemTitre: rental.itemTitre,
        itemImage: rental.itemImage,
        otherUserName: locataireNom,
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la conversation.");
    } finally {
      setContacting(false);
    }
  }

  const actionLabel = rental.statut === StatutDemande.IN_PROGRESS ? 'loue en cours' : 'loue';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RentalDetail', { rentalId: rental.id, role: 'proprietaire' })}
      activeOpacity={0.75}
    >
      {/* Header : avatar + nom + badge */}
      <View style={styles.demandeHeader}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initiales}</Text>
        </View>
        <View style={styles.demandeInfo}>
          <Text style={styles.demandeTitre} numberOfLines={1}>{locataireNom}</Text>
          <Text style={styles.demandeObjet} numberOfLines={1}>{actionLabel} {rental.itemTitre}</Text>
        </View>
        <StatusBadge statut={rental.statut} />
      </View>

      {/* Dates + prix */}
      <View style={styles.demandeMeta}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.demandeMetaText}>
          {formatDateRange(rental.dateDebut, rental.dateFin)}
          {' · '}{rental.jours} jour{rental.jours > 1 ? 's' : ''}
          {' · '}{rental.prixTotal} MAD
        </Text>
      </View>

      {/* Bouton contacter */}
      <TouchableOpacity
        style={[styles.btnContactOutline, contacting && { opacity: 0.6 }]}
        onPress={handleContact}
        disabled={contacting}
        activeOpacity={0.8}
      >
        {contacting ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
            <Text style={styles.btnContactOutlineText}>Contacter</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Tab 3 — PasseeDemandeCard (COMPLETED + REJECTED + CANCELLED) ─

function PasseeDemandeCard({
  rental,
  navigation,
}: {
  rental: RentalWithOther;
  navigation: NavProp;
}) {
  const locataire = rental.otherUser;
  const initiales = getInitials(locataire);
  const avatarColor = avatarColorFromUid(rental.locataireId);
  const locataireNom = fullName(locataire);

  return (
    <TouchableOpacity
      style={[styles.card, { opacity: 0.65 }]}
      onPress={() => navigation.navigate('RentalDetail', { rentalId: rental.id, role: 'proprietaire' })}
      activeOpacity={0.75}
    >
      <View style={styles.demandeHeader}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initiales}</Text>
        </View>
        <View style={styles.demandeInfo}>
          <Text style={styles.demandeTitre} numberOfLines={1}>{locataireNom}</Text>
          <Text style={styles.demandeObjet} numberOfLines={1}>demandé par {shortName(locataire)}</Text>
        </View>
        <StatusBadge statut={rental.statut} />
      </View>

      <View style={styles.demandeMeta}>
        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.demandeMetaText}>
          {formatDateRange(rental.dateDebut, rental.dateFin)}
          {' · '}{rental.prixTotal} MAD
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tab 3 — DemandesTab ─────────────────────────────────────

function DemandesTab({
  demandes,
  navigation,
  onAccept,
  onReject,
}: {
  demandes: RentalWithOther[];
  navigation: NavProp;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const enAttente = demandes.filter(r => r.statut === StatutDemande.PENDING);
  const actives = demandes.filter(
    r => r.statut === StatutDemande.ACCEPTED || r.statut === StatutDemande.IN_PROGRESS,
  );
  const passees = demandes.filter(
    r =>
      r.statut === StatutDemande.COMPLETED ||
      r.statut === StatutDemande.REJECTED ||
      r.statut === StatutDemande.CANCELLED,
  );

  if (enAttente.length === 0 && actives.length === 0 && passees.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-outline" size={52} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>Aucune demande reçue</Text>
        <Text style={styles.emptySubtitle}>Les demandes de location apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {enAttente.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>EN ATTENTE</Text>
          {enAttente.map((r) => (
            <DemandeCard key={r.id} rental={r} navigation={navigation} onAccept={onAccept} onReject={onReject} />
          ))}
        </>
      )}

      {actives.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, (enAttente.length > 0) && { marginTop: Spacing.xl }]}>
            ACTIVES
          </Text>
          {actives.map((r) => (
            <ActiveDemandeCard key={r.id} rental={r} navigation={navigation} />
          ))}
        </>
      )}

      {passees.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, (enAttente.length > 0 || actives.length > 0) && { marginTop: Spacing.xl }]}>
            PASSÉES
          </Text>
          {passees.map((r) => (
            <PasseeDemandeCard key={r.id} rental={r} navigation={navigation} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Screen ───────────────────────────────────────────────────

type Props = StackScreenProps<LocationsStackParamList, 'MesLocations'>;

export default function MesLocationsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>(route.params?.initialTab ?? 'encours');
  const [loading, setLoading] = useState(true);
  const [mesLocations, setMesLocations] = useState<RentalWithOther[]>([]);
  const [mesItems, setMesItems] = useState<Item[]>([]);
  const [demandesRecues, setDemandesRecues] = useState<RentalWithOther[]>([]);
  const isFirstLoad = useRef(true);

  const loadData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }
    if (isFirstLoad.current) setLoading(true);

    const [envoyees, items, recues] = await Promise.all([
      getRentalsByLocataire(uid),
      getItemsByOwner(uid),
      getRentalsByProprietaire(uid),
    ]);

    const [envoyeesWithOther, recuesPendingWithOther] = await Promise.all([
      Promise.all(
        envoyees.map(async (r) => ({
          ...r,
          otherUser: r.proprietaireId ? await getUserById(r.proprietaireId) : null,
        })),
      ),
      Promise.all(
        recues
          .filter((r) => r.locataireId && r.locataireId.length > 0)
          .map(async (r) => ({
            ...r,
            otherUser: await getUserById(r.locataireId),
          })),
      ),
    ]);

    setMesLocations(envoyeesWithOther);
    setMesItems(items);
    setDemandesRecues(recuesPendingWithOther);
    setLoading(false);
    isFirstLoad.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleAccept = useCallback(
    async (rentalId: string) => {
      await updateRentalStatus(rentalId, StatutDemande.ACCEPTED);
      loadData();
    },
    [loadData],
  );

  const handleReject = useCallback(
    async (rentalId: string) => {
      await updateRentalStatus(rentalId, StatutDemande.REJECTED);
      loadData();
    },
    [loadData],
  );

  const enCoursCount = mesLocations.filter(
    (r) =>
      r.statut === StatutDemande.PENDING ||
      r.statut === StatutDemande.ACCEPTED ||
      r.statut === StatutDemande.IN_PROGRESS,
  ).length;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'encours',  label: 'En cours',      count: enCoursCount },
    { id: 'annonces', label: 'Mes annonces',  count: mesItems.length },
    { id: 'demandes', label: 'Demandes',      count: demandesRecues.filter(r => r.statut === StatutDemande.PENDING).length },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes locations</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View style={[styles.tabPane, activeTab !== 'encours' && styles.tabHidden]}>
            <EnCoursTab rentals={mesLocations} navigation={navigation} />
          </View>
          <View style={[styles.tabPane, activeTab !== 'annonces' && styles.tabHidden]}>
            <AnnoncesTab items={mesItems} navigation={navigation} />
          </View>
          <View style={[styles.tabPane, activeTab !== 'demandes' && styles.tabHidden]}>
            <DemandesTab
              demandes={demandesRecues}
              navigation={navigation}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </View>
        </>
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

  // ── Header ──
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
  },

  // ── Tab bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
  },
  tabLabelActive: {
    fontFamily: Typography.fontHeading,
    color: Colors.primary,
  },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabCountActive: {
    backgroundColor: Colors.primaryXLight,
  },
  tabCountText: {
    fontFamily: Typography.fontHeading,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  tabCountTextActive: {
    color: Colors.primary,
  },

  // ── Loading ──
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Tab scroll content ──
  tabContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['6xl'],
    gap: Spacing.md,
  },

  // ── Section label ──
  sectionLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: 13,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },

  // ── Card base ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cardThumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  cardDates: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardMeta: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cardPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 15,
    color: Colors.primary,
  },

  // ── Card actions (Tab 1 ACCEPTED) ──
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnGreen: {
    flex: 1,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGreenText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.textInverse,
  },
  btnOutline: {
    flex: 1,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── Badge ──
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: Typography.fontSubheading,
    fontSize: 11,
  },

  // ── Accepted card contact button ──
  btnContactOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: Spacing.md,
  },
  btnContactOutlineText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 14,
    color: Colors.primary,
  },

  // ── CTA button (Tab 2) ──
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primaryXLight,
  },
  ctaText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.primary,
  },

  // ── Demande card ──
  demandeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textInverse,
  },
  demandeInfo: {
    flex: 1,
    gap: 2,
  },
  demandeTitre: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  demandeObjet: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messageBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  messageText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  demandeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  demandeMetaText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  demandeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnRefuser: {
    flex: 4,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRefuserText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  btnAccepter: {
    flex: 6,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  btnAccepterText: {
    fontFamily: Typography.fontHeading,
    fontSize: 14,
    color: Colors.textInverse,
  },

  // ── Tab panes (always mounted, hidden when inactive) ──
  tabPane: {
    flex: 1,
  },
  tabHidden: {
    display: 'none',
  },

  // ── Empty states ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['6xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
