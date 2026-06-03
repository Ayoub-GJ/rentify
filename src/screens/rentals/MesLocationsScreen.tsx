import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import SmartImage from '../../components/SmartImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase.config';
import {
  getRentalsByLocataire,
  getRentalsByProprietaire,
  updateRentalStatus,
  getUserById,
  RentalData,
} from '../../services/firestoreService';
import { StatutDemande } from '../../types';
import { LocationsStackParamList } from '../../navigation/types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

type RentalWithUser = RentalData & { locataireNom?: string };

// ─── Helpers ──────────────────────────────────────────────────

const MONTH_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTH_FR[date.getMonth()]}`;
}

const STATUT_CONFIG: Record<StatutDemande, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'En attente', bg: Colors.pendingBg,   color: Colors.pending },
  ACCEPTED:  { label: 'Acceptée',   bg: Colors.acceptedBg,  color: Colors.accepted },
  REJECTED:  { label: 'Refusée',    bg: Colors.rejectedBg,  color: Colors.rejected },
  COMPLETED: { label: 'Terminée',   bg: Colors.completedBg, color: Colors.completed },
  CANCELLED: { label: 'Annulée',    bg: Colors.cancelledBg, color: Colors.cancelled },
};

// ─── RentalCard ───────────────────────────────────────────────

type NavProp = StackScreenProps<LocationsStackParamList, 'MesLocations'>['navigation'];

interface RentalCardProps {
  rental: RentalWithUser;
  isProprietaire: boolean;
  navigation: NavProp;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

function RentalCard({ rental, isProprietaire, navigation, onAccept, onReject }: RentalCardProps) {
  const cfg = STATUT_CONFIG[rental.statut];

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <SmartImage uri={rental.itemImage} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          {isProprietaire && rental.locataireNom && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
              <Text style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: Typography.fontBody }}>
                Demande de {rental.locataireNom}
              </Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={1}>{rental.itemTitre}</Text>
          <View style={styles.cardDateRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.cardDate}>
              {' '}{formatDate(rental.dateDebut)} → {formatDate(rental.dateFin)} · {rental.jours} jour{rental.jours > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>{rental.prixTotal} MAD</Text>

        <View style={styles.footerActions}>
          {/* Boutons propriétaire : PENDING → Accepter / Refuser */}
          {isProprietaire && rental.statut === StatutDemande.PENDING && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnAccept]}
                onPress={() => onAccept(rental.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: Colors.accepted }]}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnRed]}
                onPress={() => onReject(rental.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Boutons locataire */}
          {!isProprietaire && rental.statut === StatutDemande.PENDING && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRed]} activeOpacity={0.8}>
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Annuler</Text>
            </TouchableOpacity>
          )}
          {rental.statut === StatutDemande.ACCEPTED && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOrange]}
              onPress={() => navigation.navigate('Chat', { rentalId: rental.id })}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Contacter</Text>
            </TouchableOpacity>
          )}
          {!isProprietaire && rental.statut === StatutDemande.COMPLETED && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]} activeOpacity={0.8}>
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Évaluer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Section ──────────────────────────────────────────────────

interface SectionProps {
  title: string;
  rentals: RentalWithUser[];
  isProprietaire: boolean;
  navigation: NavProp;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

function Section({ title, rentals, isProprietaire, navigation, onAccept, onReject }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rentals.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune location pour l'instant</Text>
        </View>
      ) : (
        rentals.map((r) => (
          <RentalCard
            key={r.id}
            rental={r}
            isProprietaire={isProprietaire}
            navigation={navigation}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

type Tab = 'encours' | 'historique';
type Props = StackScreenProps<LocationsStackParamList, 'MesLocations'>;

const HISTORIQUE_STATUTS = [StatutDemande.REJECTED, StatutDemande.CANCELLED, StatutDemande.COMPLETED];

export default function MesLocationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('encours');
  const [demandesEnvoyees, setDemandesEnvoyees] = useState<RentalWithUser[]>([]);
  const [demandesRecues, setDemandesRecues] = useState<RentalWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const loadRentals = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    if (isFirstLoad.current) {
      setLoading(true);
    }

    const [envoyees, recues] = await Promise.all([
      getRentalsByLocataire(user.uid),
      getRentalsByProprietaire(user.uid),
    ]);

    console.log('Rentals as proprietaire:', recues.length, 'for uid:', user.uid);

    const recuesWithUsers = await Promise.all(
      recues.map(async (r) => {
        const locataire = await getUserById(r.locataireId);
        const nom = locataire
          ? `${locataire.prenom} ${locataire.nom}`.trim() || locataire.nom || 'Utilisateur'
          : 'Utilisateur';
        return { ...r, locataireNom: nom };
      })
    );

    setDemandesEnvoyees(envoyees);
    setDemandesRecues(recuesWithUsers);
    setLoading(false);
    isFirstLoad.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRentals();
    }, [loadRentals])
  );

  const handleAccept = useCallback(async (rentalId: string) => {
    await updateRentalStatus(rentalId, StatutDemande.ACCEPTED);
    loadRentals();
  }, [loadRentals]);

  const handleReject = useCallback(async (rentalId: string) => {
    await updateRentalStatus(rentalId, StatutDemande.REJECTED);
    loadRentals();
  }, [loadRentals]);

  // Filtrage par onglet
  const isHistorique = (r: RentalWithUser) => HISTORIQUE_STATUTS.includes(r.statut);
  const isEnCours = (r: RentalWithUser) => !isHistorique(r);

  const filter = activeTab === 'encours' ? isEnCours : isHistorique;
  const demandes = demandesEnvoyees.filter(filter);
  const annonces = demandesRecues.filter(filter);

  const listData = [
    { key: 'demandes', title: 'Mes demandes', rentals: demandes, isProprietaire: false },
    { key: 'annonces', title: 'Mes annonces', rentals: annonces, isProprietaire: true },
  ];

  const totalCount = demandesEnvoyees.length + demandesRecues.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes locations</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {(['encours', 'historique'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'encours' ? 'En cours' : 'Historique';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.globalEmpty}>
          <Ionicons name="calendar-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.globalEmptyText}>Aucune location pour le moment</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Section
              title={item.title}
              rentals={item.rentals}
              isProprietaire={item.isProprietaire}
              navigation={navigation}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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

  // Tabs
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  tabLabelActive: {
    fontFamily: Typography.fontHeading,
    color: Colors.primary,
  },

  // Loading
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Global empty
  globalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  globalEmptyText: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textTertiary,
  },

  // List
  listContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['6xl'],
  },

  // Section
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Empty state (per section)
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textTertiary,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Badge
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: Typography.fontSubheading,
    fontSize: 11,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardPrice: {
    fontFamily: Typography.fontDisplay,
    fontSize: 16,
    color: Colors.primary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Action buttons
  actionBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderWidth: 1,
  },
  actionBtnRed: {
    borderColor: Colors.error,
  },
  actionBtnOrange: {
    borderColor: Colors.primary,
  },
  actionBtnAccept: {
    borderColor: Colors.accepted,
  },
  actionBtnText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
  },
});
