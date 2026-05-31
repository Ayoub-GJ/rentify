import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

type Statut = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
type RentalType = 'demande' | 'annonce';

interface MockRental {
  id: string;
  itemTitre: string;
  itemImage: string;
  dateDebut: string;
  dateFin: string;
  jours: number;
  prixTotal: number;
  statut: Statut;
  type: RentalType;
}

// ─── Mock data ────────────────────────────────────────────────

const MOCK_RENTALS: MockRental[] = [
  {
    id: '1',
    itemTitre: 'Perceuse Bosch GSB 18V',
    itemImage: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400',
    dateDebut: '2026-06-01',
    dateFin: '2026-06-04',
    jours: 3,
    prixTotal: 75,
    statut: 'ACCEPTED',
    type: 'demande',
  },
  {
    id: '2',
    itemTitre: 'Appareil Photo Sony A7 III',
    itemImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    dateDebut: '2026-06-10',
    dateFin: '2026-06-12',
    jours: 2,
    prixTotal: 160,
    statut: 'PENDING',
    type: 'demande',
  },
  {
    id: '3',
    itemTitre: 'Vélo VTT Trek Marlin',
    itemImage: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400',
    dateDebut: '2026-05-20',
    dateFin: '2026-05-22',
    jours: 2,
    prixTotal: 70,
    statut: 'COMPLETED',
    type: 'demande',
  },
  {
    id: '4',
    itemTitre: 'MacBook Pro 14" M3',
    itemImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    dateDebut: '2026-06-05',
    dateFin: '2026-06-07',
    jours: 2,
    prixTotal: 240,
    statut: 'PENDING',
    type: 'annonce',
  },
  {
    id: '5',
    itemTitre: 'Sono JBL Xtreme 3',
    itemImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    dateDebut: '2026-05-15',
    dateFin: '2026-05-17',
    jours: 2,
    prixTotal: 90,
    statut: 'COMPLETED',
    type: 'annonce',
  },
];

// ─── Helpers ──────────────────────────────────────────────────

const MONTH_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTH_FR[parseInt(m, 10) - 1]}`;
}

const STATUT_CONFIG: Record<Statut, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'En attente', bg: Colors.pendingBg,   color: Colors.pending },
  ACCEPTED:  { label: 'Acceptée',   bg: Colors.acceptedBg,  color: Colors.accepted },
  REJECTED:  { label: 'Refusée',    bg: Colors.rejectedBg,  color: Colors.rejected },
  COMPLETED: { label: 'Terminée',   bg: Colors.completedBg, color: Colors.completed },
  CANCELLED: { label: 'Annulée',    bg: Colors.cancelledBg, color: Colors.cancelled },
};

// ─── RentalCard ───────────────────────────────────────────────

function RentalCard({ rental }: { rental: MockRental }) {
  const cfg = STATUT_CONFIG[rental.statut];

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <Image source={{ uri: rental.itemImage }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{rental.itemTitre}</Text>
          <View style={styles.cardDateRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.cardDate}>
              {' '}{formatDate(rental.dateDebut)} → {formatDate(rental.dateFin)} · {rental.jours} jour{rental.jours > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {/* Badge statut */}
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>{rental.prixTotal} MAD</Text>
        {rental.statut === 'PENDING' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRed]}>
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Annuler</Text>
          </TouchableOpacity>
        )}
        {rental.statut === 'ACCEPTED' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]}>
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Contacter</Text>
          </TouchableOpacity>
        )}
        {rental.statut === 'COMPLETED' && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]}>
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Évaluer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Section ──────────────────────────────────────────────────

function Section({ title, rentals }: { title: string; rentals: MockRental[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rentals.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune location pour l'instant</Text>
        </View>
      ) : (
        rentals.map((r) => <RentalCard key={r.id} rental={r} />)
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

type Tab = 'encours' | 'historique';

export default function MesLocationsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('encours');

  const enCours = MOCK_RENTALS.filter((r) =>
    r.statut === 'PENDING' || r.statut === 'ACCEPTED',
  );
  const historique = MOCK_RENTALS.filter((r) =>
    r.statut === 'COMPLETED' || r.statut === 'REJECTED' || r.statut === 'CANCELLED',
  );

  const source = activeTab === 'encours' ? enCours : historique;
  const demandes = source.filter((r) => r.type === 'demande');
  const annonces = source.filter((r) => r.type === 'annonce');

  // FlatList data: two "section" items
  const listData = [
    { key: 'demandes', title: 'Mes demandes', rentals: demandes },
    { key: 'annonces', title: 'Mes annonces', rentals: annonces },
  ];

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
      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Section title={item.title} rentals={item.rentals} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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

  // Empty state
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
  actionBtnText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
  },
});
