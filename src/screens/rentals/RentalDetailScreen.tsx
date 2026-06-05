import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import SmartImage from '../../components/SmartImage';
import RentalProgressStepper from '../../components/RentalProgressStepper';
import {
  getRentalById,
  getUserById,
  getItemById,
  confirmerRemise,
  confirmerRetour,
  annulerLocation,
  updateRentalStatus,
  getOrCreateConversation,
  RentalData,
} from '../../services/firestoreService';
import { StatutDemande, User, Item } from '../../types';
import type { MockItem } from '../../data/mockItems';
import { auth } from '../../config/firebase.config';
import { LocationsStackParamList } from '../../navigation/types';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
} from '../../theme/theme';
import {
  fullName,
  getInitials,
  avatarColorFromUid,
  formatDateShort,
  formatDateRange,
} from '../../utils/formatters';

// ─── Types ───────────────────────────────────────────────────

type Props = StackScreenProps<LocationsStackParamList, 'RentalDetail'>;

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

// ─── Section header ──────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

// ─── Action button helpers ────────────────────────────────────

function ActionButton({
  label,
  onPress,
  loading,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const btnStyle =
    variant === 'primary' ? styles.btnPrimary
    : variant === 'danger' ? styles.btnDanger
    : styles.btnOutline;
  const textStyle =
    variant === 'primary' ? styles.btnPrimaryText
    : variant === 'danger' ? styles.btnDangerText
    : styles.btnOutlineText;

  return (
    <TouchableOpacity
      style={[btnStyle, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? Colors.primary : Colors.textInverse} />
      ) : (
        <View style={styles.btnInner}>
          {icon && <Ionicons name={icon} size={16} color={variant === 'outline' ? Colors.primary : Colors.textInverse} />}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function WaitingMessage({ text }: { text: string }) {
  return (
    <View style={styles.waitingBox}>
      <Ionicons name="time-outline" size={16} color={Colors.textTertiary} />
      <Text style={styles.waitingText}>{text}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────

export default function RentalDetailScreen({ navigation, route }: Props) {
  const { rentalId, role } = route.params;
  const insets = useSafeAreaInsets();

  const [rental, setRental] = useState<RentalData | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [contacting, setContacting] = useState(false);

  const loadRental = useCallback(async () => {
    const r = await getRentalById(rentalId);
    if (!r) { setLoading(false); return; }
    setRental(r);

    const otherId = role === 'locataire' ? r.proprietaireId : r.locataireId;
    const [user, fetchedItem] = await Promise.all([
      getUserById(otherId),
      getItemById(r.itemId),
    ]);
    setOtherUser(user);
    setItem(fetchedItem);
    setLoading(false);
  }, [rentalId, role]);

  useEffect(() => {
    loadRental();
  }, [loadRental]);

  async function withAction(fn: () => Promise<void>) {
    setActionLoading(true);
    try {
      await fn();
      await loadRental();
      Alert.alert('Confirmation enregistrée');
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue, réessaie.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    if (!rental) return;
    await withAction(() => updateRentalStatus(rental.id, StatutDemande.ACCEPTED));
  }

  async function handleReject() {
    if (!rental) return;
    Alert.alert('Refuser la demande ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: () => withAction(() => updateRentalStatus(rental.id, StatutDemande.REJECTED)),
      },
    ]);
  }

  async function handleCancel() {
    if (!rental) return;
    Alert.alert('Annuler la demande ?', 'Cette action est irréversible.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: () => withAction(() => annulerLocation(rental.id)),
      },
    ]);
  }

  async function handleConfirmerRemise() {
    if (!rental) return;
    await withAction(() => confirmerRemise(rental.id, role));
  }

  async function handleConfirmerRetour() {
    if (!rental) return;
    await withAction(() => confirmerRetour(rental.id, role));
  }

  async function handleContact() {
    const uid = auth.currentUser?.uid;
    if (!uid || !rental) return;
    setContacting(true);
    try {
      const otherId = role === 'locataire' ? rental.proprietaireId : rental.locataireId;
      const convId = await getOrCreateConversation(uid, otherId, rental.itemId, rental.itemTitre);
      navigation.navigate('Chat', {
        conversationId: convId,
        itemTitre: rental.itemTitre,
        itemImage: rental.itemImage,
        otherUserName: fullName(otherUser),
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir la conversation.");
    } finally {
      setContacting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }, styles.centered]}>
        <Text style={styles.errorText}>Location introuvable.</Text>
      </View>
    );
  }

  const isLocataire = role === 'locataire';
  const headerTitle = isLocataire ? 'Ma location' : 'Demande reçue';
  const otherUserLabel = isLocataire ? 'Propriétaire' : 'Locataire';
  const initiales = getInitials(otherUser);
  const avatarColor = avatarColorFromUid(
    isLocataire ? rental.proprietaireId : rental.locataireId,
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Layout.tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stepper */}
        <SectionCard>
          <RentalProgressStepper currentStatut={rental.statut} />
        </SectionCard>

        {/* Objet */}
        <SectionCard>
          <SectionTitle label="Objet" />
          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => item && navigation.navigate('ItemDetail', { item: toMockItem(item) })}
            activeOpacity={item ? 0.75 : 1}
          >
            <SmartImage uri={rental.itemImage} style={styles.itemThumb} resizeMode="cover" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitre} numberOfLines={2}>{rental.itemTitre}</Text>
              {item && (
                <>
                  <Text style={styles.itemPrice}>{item.prixParJour} MAD/jour</Text>
                  <Text style={styles.itemVille}>{item.ville}</Text>
                </>
              )}
            </View>
            {item && <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
          </TouchableOpacity>
        </SectionCard>

        {/* Personne */}
        <SectionCard>
          <SectionTitle label={otherUserLabel} />
          <View style={styles.personRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initiales}</Text>
            </View>
            <Text style={styles.personName}>{fullName(otherUser)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.btnOutlineFull, contacting && { opacity: 0.6 }]}
            onPress={handleContact}
            disabled={contacting}
            activeOpacity={0.8}
          >
            {contacting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                <Text style={styles.btnOutlineFullText}>Contacter</Text>
              </View>
            )}
          </TouchableOpacity>
        </SectionCard>

        {/* Détails */}
        <SectionCard>
          <SectionTitle label="Détails de la location" />
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatDateRange(rental.dateDebut, rental.dateFin)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{rental.jours} jour{rental.jours > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailPrice}>{rental.prixTotal} MAD au total</Text>
          </View>
          {!!rental.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>« {rental.message} »</Text>
            </View>
          )}
        </SectionCard>

        {/* Actions contextuelles */}
        <ActionsSection
          rental={rental}
          role={role}
          actionLoading={actionLoading}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
          onConfirmerRemise={handleConfirmerRemise}
          onConfirmerRetour={handleConfirmerRetour}
        />
      </ScrollView>
    </View>
  );
}

// ─── ActionsSection ───────────────────────────────────────────

function ActionsSection({
  rental,
  role,
  actionLoading,
  onAccept,
  onReject,
  onCancel,
  onConfirmerRemise,
  onConfirmerRetour,
}: {
  rental: RentalData;
  role: 'locataire' | 'proprietaire';
  actionLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onConfirmerRemise: () => void;
  onConfirmerRetour: () => void;
}) {
  const { statut } = rental;

  // PENDING
  if (statut === StatutDemande.PENDING) {
    if (role === 'proprietaire') {
      return (
        <SectionCard>
          <SectionTitle label="Actions" />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnRefuser, { flex: 1 }]} onPress={onReject} disabled={actionLoading} activeOpacity={0.8}>
              {actionLoading
                ? <ActivityIndicator size="small" color={Colors.textSecondary} />
                : <Text style={styles.btnRefuserText}>Refuser</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAccepter, { flex: 1 }]} onPress={onAccept} disabled={actionLoading} activeOpacity={0.8}>
              {actionLoading
                ? <ActivityIndicator size="small" color={Colors.textInverse} />
                : <View style={styles.btnInner}>
                    <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                    <Text style={styles.btnAccepterText}>Accepter</Text>
                  </View>}
            </TouchableOpacity>
          </View>
        </SectionCard>
      );
    }
    // locataire
    return (
      <SectionCard>
        <SectionTitle label="Actions" />
        <ActionButton label="Annuler ma demande" onPress={onCancel} loading={actionLoading} variant="danger" icon="close-circle-outline" />
      </SectionCard>
    );
  }

  // ACCEPTED
  if (statut === StatutDemande.ACCEPTED) {
    return (
      <SectionCard>
        <View style={styles.remiseHeader}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.remiseHeaderText}>
            Remise prévue le {formatDateShort(rental.dateDebut)}
          </Text>
        </View>

        {role === 'proprietaire' ? (
          rental.remiseProprio ? (
            <WaitingMessage text="En attente de confirmation du locataire" />
          ) : (
            <ActionButton
              label="J'ai remis l'objet"
              onPress={onConfirmerRemise}
              loading={actionLoading}
              icon="checkmark-circle-outline"
            />
          )
        ) : (
          rental.remiseLocataire ? (
            <WaitingMessage text="En attente de confirmation du propriétaire" />
          ) : (
            <ActionButton
              label="J'ai bien reçu l'objet"
              onPress={onConfirmerRemise}
              loading={actionLoading}
              icon="checkmark-circle-outline"
            />
          )
        )}
      </SectionCard>
    );
  }

  // IN_PROGRESS
  if (statut === StatutDemande.IN_PROGRESS) {
    return (
      <SectionCard>
        <View style={styles.remiseHeader}>
          <Ionicons name="refresh-outline" size={16} color={Colors.info} />
          <Text style={[styles.remiseHeaderText, { color: Colors.info }]}>
            Location en cours — retour prévu le {formatDateShort(rental.dateFin)}
          </Text>
        </View>

        {role === 'locataire' ? (
          rental.retourLocataire ? (
            <WaitingMessage text="En attente de confirmation du propriétaire" />
          ) : (
            <ActionButton
              label="J'ai rendu l'objet"
              onPress={onConfirmerRetour}
              loading={actionLoading}
              icon="checkmark-circle-outline"
            />
          )
        ) : (
          rental.retourProprio ? (
            <WaitingMessage text="En attente de confirmation du locataire" />
          ) : (
            <ActionButton
              label="Objet récupéré"
              onPress={onConfirmerRetour}
              loading={actionLoading}
              icon="checkmark-circle-outline"
            />
          )
        )}
      </SectionCard>
    );
  }

  // COMPLETED
  if (statut === StatutDemande.COMPLETED) {
    return (
      <View style={styles.completedCard}>
        <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        <Text style={styles.completedText}>
          Location terminée{rental.retourAt ? ` le ${formatDateShort(rental.retourAt)}` : ''}
        </Text>
        {/* TODO: ajouter "Laisser un avis" quand le système d'avis sera implémenté */}
      </View>
    );
  }

  return null;
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },

  // ── Scroll ──
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Section card ──
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },

  // ── Item ──
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemTitre: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },
  itemVille: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },

  // ── Person ──
  personRow: {
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
  },
  avatarText: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textInverse,
  },
  personName: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  btnOutlineFull: {
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineFullText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },

  // ── Details ──
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  detailPrice: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  messageBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  messageText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // ── Action buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  btnPrimary: {
    height: Layout.buttonHeight.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    ...Shadows.button,
  },
  btnPrimaryText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  btnDanger: {
    height: Layout.buttonHeight.md,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  btnDangerText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.error,
  },
  btnOutline: {
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  btnOutlineText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  btnRefuser: {
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRefuserText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  btnAccepter: {
    height: 44,
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
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },

  // ── Remise/Retour ──
  remiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  remiseHeaderText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Waiting ──
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  waitingText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    flex: 1,
  },

  // ── Completed ──
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  completedText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.success,
    flex: 1,
  },
});
