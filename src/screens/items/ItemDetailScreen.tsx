import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import SmartImage from '../../components/SmartImage';
import UserAvatar from '../../components/UserAvatar';
import {
  getUserById,
  getOrCreateConversation,
  countPendingRentalsForItem,
  getMyRentalForItem,
  getItemRatingStats,
  getReviewsByItem,
  getItemById,
} from '../../services/firestoreService';
import { useFavorite } from '../../hooks/useFavorite';
import StarRating from '../../components/StarRating';
import { fullName, getInitials, avatarColorFromUid, formatDateShort } from '../../utils/formatters';
import { Review, StatutDemande } from '../../types';
import { auth } from '../../config/firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';
import {
  HomeStackParamList,
  SearchStackParamList,
  LocationsStackParamList,
} from '../../navigation/types';

// ─── Types ───────────────────────────────────────────────────

type NavProp = StackNavigationProp<HomeStackParamList, 'ItemDetail'>;
type RouteType = RouteProp<
  HomeStackParamList | SearchStackParamList | LocationsStackParamList,
  'ItemDetail'
>;

type ItemContext =
  | { kind: 'visitor' }
  | { kind: 'owner_idle' }
  | { kind: 'owner_with_requests'; count: number }
  | { kind: 'tenant_pending'; rentalId: string }
  | { kind: 'tenant_accepted'; rentalId: string }
  | { kind: 'tenant_completed'; rentalId: string };

// ─── Constantes ──────────────────────────────────────────────

const FALLBACK_DESCRIPTION =
  "Objet en parfait état, entretenu régulièrement. Idéal pour vos projets ponctuels. " +
  "Disponible à la location à Agadir. Livraison possible sur Agadir centre. " +
  "Contactez-moi pour plus d'informations et disponibilités.";

// ─── Screen ──────────────────────────────────────────────────

export default function ItemDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { item: initialItem } = route.params;
  const insets = useSafeAreaInsets();

  // État local : initialisé depuis les params, rafraîchi depuis Firestore au focus
  const [item, setItem] = useState(initialItem);

  const { isFav, toggle: toggleFav } = useFavorite(item.id);
  const [expanded, setExpanded] = useState(false);
  const [proprietaire, setProprietaire] = useState(item.proprietaire);
  const [loadingContact, setLoadingContact] = useState(false);
  const [context, setContext] = useState<ItemContext | null>(null);
  const [itemRating, setItemRating] = useState({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
// Charger le nom du proprio une seule fois (si placeholder)
  useEffect(() => {
    if (proprietaire.nom === 'Propriétaire' && item.proprietaireId) {
      getUserById(item.proprietaireId).then((user) => {
        if (user) setProprietaire({ nom: fullName(user), initiales: getInitials(user) });
      });
    }
  }, [item.proprietaireId]);

  // Charger les stats et avis de l'objet
  useEffect(() => {
    if (!item?.id) return;
    Promise.all([getItemRatingStats(item.id), getReviewsByItem(item.id)])
      .then(([stats, reviewsData]) => {
        setItemRating(stats);
        setReviews(reviewsData);
      })
      .catch((err) => {
        console.error('[ItemDetail] Reviews fetch error:', err);
        setItemRating({ average: 0, count: 0 });
        setReviews([]);
      });
  }, [item?.id]);

  // Rafraîchir les données de l'objet depuis Firestore à chaque focus
  // (capture les modifications de titre, prix, images faites via AddItemScreen)
  useFocusEffect(
    useCallback(() => {
      getItemById(item.id)
        .then((fresh) => {
          if (!fresh) return;
          setItem((prev) => ({
            ...prev,
            titre: fresh.titre,
            description: fresh.description ?? prev.description,
            prixParJour: fresh.prixParJour,
            ville: fresh.ville,
            images: fresh.images ?? prev.images,
            photoUrl: fresh.photoUrl,
            disponible: fresh.actif,
            periodeMin: fresh.periodeMin ?? prev.periodeMin,
            proprietaire: fresh.proprietaire ?? prev.proprietaire,
          }));
        })
        .catch((err) => console.warn('[ItemDetail] refresh item error:', err));
    }, [item.id]),
  );

  // Détecter le contexte à chaque focus (mise à jour après réservation, etc.)
  useFocusEffect(
    useCallback(() => {
      async function detectContext() {
        const uid = auth.currentUser?.uid;
        if (!uid) { setContext({ kind: 'visitor' }); return; }

        if (uid === item.proprietaireId) {
          const count = await countPendingRentalsForItem(item.id, uid);
          setContext(count > 0
            ? { kind: 'owner_with_requests', count }
            : { kind: 'owner_idle' },
          );
        } else {
          const rental = await getMyRentalForItem(uid, item.id);
          if (!rental) {
            setContext({ kind: 'visitor' });
          } else {
            switch (rental.statut) {
              case StatutDemande.PENDING:
                setContext({ kind: 'tenant_pending', rentalId: rental.id });
                break;
              case StatutDemande.ACCEPTED:
                setContext({ kind: 'tenant_accepted', rentalId: rental.id });
                break;
              case StatutDemande.COMPLETED:
                setContext({ kind: 'tenant_completed', rentalId: rental.id });
                break;
              default:
                // REJECTED / CANCELLED → peut re-tenter
                setContext({ kind: 'visitor' });
            }
          }
        }
      }
      detectContext();
    }, [item.id, item.proprietaireId]),
  );

  // ── Dérivés ──
  const isOwn =
    context?.kind === 'owner_idle' || context?.kind === 'owner_with_requests';
  const hasFooter = context === null || context.kind !== 'tenant_pending';
  const FOOTER_HEIGHT = 80;
  const scrollPaddingBottom = hasFooter
    ? FOOTER_HEIGHT + insets.bottom + Spacing['2xl']
    : Spacing.xl;

  const description = item.description ?? FALLBACK_DESCRIPTION;
  const isLongDescription = description.length > 120;
  const categoryInfo = Categories.find((c) => c.id === item.categorie);

  // ── Navigation cross-tab vers MesLocations ──
  function goToMesLocations(initialTab?: 'encours' | 'annonces' | 'demandes') {
    (navigation as any).getParent()?.navigate('Locations', {
      screen: 'MesLocations',
      params: initialTab ? { initialTab } : undefined,
    });
  }

  // ── Contacter le proprio ──
  const handleContact = async () => {
    if (!auth.currentUser || !item.proprietaireId) return;
    setLoadingContact(true);
    try {
      const owner = await getUserById(item.proprietaireId);
      const conversationId = await getOrCreateConversation(
        auth.currentUser.uid,
        item.proprietaireId,
        item.id,
        item.titre,
      );
      navigation.navigate('Chat', {
        conversationId,
        itemTitre: item.titre,
        itemImage: item.images[0] ?? '',
        otherUserName: fullName(owner),
        otherUserId: item.proprietaireId,
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la conversation.");
    } finally {
      setLoadingContact(false);
    }
  };

  // ── Bannière contextuelle ──
  function renderBanner() {
    if (!context) return null;

    // Objet archivé/supprimé : priorité sur toutes les autres bannières
    if (!item.disponible) {
      if (isOwn) {
        return (
          <View style={[styles.banner, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="archive-outline" size={20} color={Colors.warning} />
            <Text style={[styles.bannerText, { color: Colors.warning }]}>
              Cette annonce est actuellement archivée
            </Text>
          </View>
        );
      }
      return (
        <View style={[styles.banner, { backgroundColor: Colors.surfaceAlt }]}>
          <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={[styles.bannerText, { color: Colors.textSecondary }]}>
            Cet objet n'est plus disponible à la location
          </Text>
        </View>
      );
    }

    switch (context.kind) {
      case 'owner_idle':
        return (
          <View style={[styles.banner, { backgroundColor: Colors.infoLight }]}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={[styles.bannerText, { color: Colors.info }]}>
              Ceci est votre annonce
            </Text>
          </View>
        );

      case 'owner_with_requests':
        return (
          <TouchableOpacity
            style={[styles.banner, { backgroundColor: Colors.acceptedBg }]}
            onPress={() => goToMesLocations('demandes')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={20} color={Colors.accepted} />
            <Text style={[styles.bannerText, { color: Colors.accepted }]}>
              {context.count} demande{context.count > 1 ? 's' : ''} en attente — voir mes demandes
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.accepted} />
          </TouchableOpacity>
        );

      case 'tenant_pending':
        return (
          <View style={[styles.banner, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="time-outline" size={20} color={Colors.warning} />
            <Text style={[styles.bannerText, { color: Colors.warning }]}>
              Vous avez déjà fait une demande sur cet objet (en attente)
            </Text>
          </View>
        );

      case 'tenant_accepted':
        return (
          <TouchableOpacity
            style={[styles.banner, { backgroundColor: Colors.acceptedBg }]}
            onPress={() => goToMesLocations('encours')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.accepted} />
            <Text style={[styles.bannerText, { color: Colors.accepted }]}>
              Votre réservation est acceptée — voir les détails
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.accepted} />
          </TouchableOpacity>
        );

      case 'tenant_completed':
        return (
          <View style={[styles.banner, { backgroundColor: Colors.surfaceAlt }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.bannerText, { color: Colors.textSecondary }]}>
              Vous avez déjà loué cet objet
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  // ── Footer adaptatif ──
  function renderFooter() {
    const footerPb = Math.max(insets.bottom, Spacing.md);

    if (!context) {
      return (
        <View style={[styles.footer, { paddingBottom: footerPb, justifyContent: 'center' }]}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      );
    }

    switch (context.kind) {
      case 'visitor':
      case 'tenant_completed':
        return (
          <View style={[styles.footer, { paddingBottom: footerPb }]}>
            <View>
              <Text style={styles.footerPrice}>{item.prixParJour} MAD</Text>
              <Text style={styles.footerPriceUnit}>par jour</Text>
            </View>
            <TouchableOpacity
              activeOpacity={item.disponible ? 0.88 : 1}
              onPress={item.disponible ? () => navigation.navigate('Reservation', { item }) : undefined}
              style={[styles.footerBtnPrimary, !item.disponible && styles.footerBtnDisabled]}
              disabled={!item.disponible}
            >
              <Text style={styles.footerBtnPrimaryText}>
                {!item.disponible
                  ? 'Indisponible'
                  : context.kind === 'tenant_completed'
                    ? 'Réserver à nouveau'
                    : 'Réserver'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'owner_idle':
        return (
          <View style={[styles.footer, { paddingBottom: footerPb }]}>
            <TouchableOpacity
              style={[styles.footerBtnOutline, { flex: 1 }]}
              onPress={() => (navigation as any).getParent()?.navigate('AddItem', { itemId: item.id })}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.footerBtnOutlineText}>Modifier l'annonce</Text>
            </TouchableOpacity>
          </View>
        );

      case 'owner_with_requests':
        return (
          <View style={[styles.footer, { paddingBottom: footerPb }]}>
            <TouchableOpacity
              style={[styles.footerBtnPrimary, { flex: 1 }]}
              onPress={() => goToMesLocations('demandes')}
              activeOpacity={0.88}
            >
              <Ionicons name="notifications-outline" size={18} color="white" />
              <Text style={styles.footerBtnPrimaryText}>
                Voir les {context.count} demande{context.count > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'tenant_pending':
        return null;

      case 'tenant_accepted':
        return (
          <View style={[styles.footer, { paddingBottom: footerPb }]}>
            <TouchableOpacity
              style={[
                styles.footerBtnPrimary,
                { flex: 1 },
                loadingContact && { opacity: 0.6 },
              ]}
              onPress={handleContact}
              disabled={loadingContact}
              activeOpacity={0.88}
            >
              {loadingContact ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={18} color="white" />
                  <Text style={styles.footerBtnPrimaryText}>Contacter le propriétaire</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
      >
        {/* ── Image hero ── */}
        <View style={{ height: 320 }}>
          <FlatList
            data={item.images.length > 0 ? item.images : ['']}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: uri }) => (
              <SmartImage
                uri={uri}
                style={{ width: SCREEN_WIDTH, height: 320 }}
                resizeMode="cover"
              />
            )}
          />

          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonLeft, { top: insets.top + Spacing.md }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroButton, styles.heroButtonRight, { top: insets.top + Spacing.md }]}
            onPress={toggleFav}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? Colors.error : Colors.textPrimary}
            />
          </TouchableOpacity>

          {categoryInfo && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryInfo.label}</Text>
            </View>
          )}
        </View>

        {/* ── Contenu ── */}
        <View style={styles.content}>

          {/* A. Header */}
          <View style={styles.section}>
            <Text style={styles.itemTitle}>{item.titre}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{item.prixParJour} MAD</Text>
              <Text style={styles.priceUnit}>/jour</Text>
            </View>
            <View style={styles.statsRow}>
              {itemRating.count > 0 ? (
                <>
                  <StarRating value={itemRating.average} size={14} showCount count={itemRating.count} />
                  <Text style={styles.statsDot}>·</Text>
                </>
              ) : (
                <>
                  <Ionicons name="star-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.statsAvis}>Aucun avis</Text>
                  <Text style={styles.statsDot}>·</Text>
                </>
              )}
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.statsVille}>{item.ville}</Text>
            </View>
          </View>

          {/* B. Bannière contextuelle */}
          {renderBanner()}

          {/* C. Propriétaire (masqué si proprio ou non encore détecté) */}
          {!isOwn && context !== null && (
            <View style={styles.ownerCard}>
              <UserAvatar uid={item.proprietaireId ?? ''} size={44} name={proprietaire.nom} />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{proprietaire.nom}</Text>
                <Text style={styles.ownerLabel}>Propriétaire</Text>
              </View>
              {context.kind === 'visitor' || context.kind === 'tenant_completed' ? (
                <TouchableOpacity
                  style={[styles.contactButton, loadingContact && { opacity: 0.6 }]}
                  activeOpacity={0.8}
                  onPress={handleContact}
                  disabled={loadingContact}
                >
                  {loadingContact
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Text style={styles.contactButtonText}>Contacter</Text>
                  }
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* D. Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={expanded ? undefined : 3}
            >
              {description}
            </Text>
            {isLongDescription && (
              <TouchableOpacity
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.7}
                style={styles.seeMoreButton}
              >
                <Text style={styles.seeMoreText}>
                  {expanded ? 'Voir moins' : 'Voir plus'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* E. Détails */}
          <View style={[styles.section, { marginTop: Spacing.xl }]}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailChip}>
                <Ionicons
                  name={item.disponible ? 'checkmark-circle' : 'archive-outline'}
                  size={16}
                  color={item.disponible ? Colors.secondary : Colors.textTertiary}
                />
                <Text style={styles.detailChipText}>
                  {item.disponible ? 'Disponible' : 'Archivé'}
                </Text>
              </View>
              {categoryInfo && (
                <View style={styles.detailChip}>
                  <Ionicons name={categoryInfo.icon as any} size={16} color={categoryInfo.color} />
                  <Text style={styles.detailChipText}>{categoryInfo.label}</Text>
                </View>
              )}
              <View style={styles.detailChip}>
                <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                <Text style={styles.detailChipText}>{item.prixParJour} MAD/jour</Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="location" size={16} color={Colors.primary} />
                <Text style={styles.detailChipText}>{item.ville}</Text>
              </View>
              {item.periodeMin && item.periodeMin > 1 && (
                <View style={styles.detailChip}>
                  <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                  <Text style={[styles.detailChipText, { fontFamily: Typography.fontBody }]}>
                    Location minimum : {item.periodeMin} jours
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* F. Avis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Avis{itemRating.count > 0 ? ` (${itemRating.count})` : ''}
            </Text>

            {itemRating.count === 0 ? (
              <View style={styles.reviewsEmpty}>
                <Ionicons name="star-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.reviewsEmptyTitle}>Aucun avis pour le moment</Text>
                <Text style={styles.reviewsEmptySubtitle}>Soyez le premier à louer cet objet</Text>
              </View>
            ) : (
              <>
                {/* Summary */}
                <View style={styles.reviewsSummary}>
                  <Text style={styles.reviewsAverage}>{itemRating.average.toFixed(1)}</Text>
                  <StarRating value={itemRating.average} size={20} />
                  <Text style={styles.reviewsBasedOn}>Basé sur {itemRating.count} avis</Text>
                </View>

                {/* List — max 3 */}
                {reviews.slice(0, 3).map((review) => {
                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <UserAvatar uid={review.locataireId} size={36} name={review.locataireName ?? ''} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewerName}>{review.locataireName}</Text>
                          <Text style={styles.reviewDate}>{formatDateShort(review.createdAt)}</Text>
                        </View>
                        <StarRating value={review.rating} size={14} />
                      </View>
                      {!!review.commentaire && (
                        <Text style={styles.reviewComment}>"{review.commentaire}"</Text>
                      )}
                    </View>
                  );
                })}

                {/* Voir tous */}
                {itemRating.count > 3 && (
                  <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}>
                    <Text style={styles.seeAllText}>
                      Voir tous les avis ({itemRating.count})
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

        </View>
      </ScrollView>

      {renderFooter()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Hero ──
  heroImage: {
    width: '100%',
    height: 320,
  },
  heroButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  heroButtonLeft: {
    left: Layout.screenPadding,
  },
  heroButtonRight: {
    right: Layout.screenPadding,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.xl + Spacing.md,
    left: Layout.screenPadding,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    fontFamily: Typography.fontSubheading,
    fontSize: 12,
    color: Colors.textPrimary,
  },

  // ── Contenu ──
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    marginTop: -24,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing['2xl'],
  },

  // ── A. Header ──
  section: {
    gap: Spacing.md,
  },
  itemTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  price: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size['2xl'],
    color: Colors.primary,
  },
  priceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  statsNote: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  statsAvis: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  statsDot: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
    marginHorizontal: 2,
  },
  statsVille: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // ── B. Bannière contextuelle ──
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 14,
    lineHeight: 20,
  },

  // ── C. Propriétaire ──
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitials: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  ownerInfo: {
    flex: 1,
    gap: 2,
  },
  ownerName: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  ownerLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  contactButton: {
    height: 36,
    minWidth: 84,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.primary,
  },

  // ── D. Description ──
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  descriptionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  seeMoreButton: {
    marginTop: Spacing.xs,
  },
  seeMoreText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },

  // ── E. Détails ──
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '45%',
    flex: 1,
  },
  detailChipText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // ── F. Avis ──
  reviewsEmpty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
  },
  reviewsEmptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  reviewsEmptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  reviewsSummary: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  reviewsAverage: {
    fontFamily: Typography.fontDisplay,
    fontSize: 40,
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  reviewsBasedOn: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontFamily: Typography.fontHeading,
    fontSize: 14,
    color: Colors.textInverse,
  },
  reviewerName: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  reviewComment: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  seeAllText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },

  // ── Footer adaptatif ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
    gap: Spacing.md,
  },
  footerPrice: {
    fontSize: 22,
    fontFamily: Typography.fontDisplay,
    color: Colors.primary,
  },
  footerPriceUnit: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: Typography.fontBody,
  },
  footerBtnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: Layout.buttonHeight.md,
    paddingHorizontal: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footerBtnPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Typography.fontHeading,
  },
  footerBtnDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  footerBtnOutline: {
    borderRadius: Radius.full,
    height: Layout.buttonHeight.md,
    paddingHorizontal: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footerBtnOutlineText: {
    color: Colors.textTertiary,
    fontSize: 16,
    fontFamily: Typography.fontHeading,
  },
});
