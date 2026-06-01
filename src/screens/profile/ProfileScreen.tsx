import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUserProfile, logout } from '../../services/authService';
import { User } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

type BadgeType = 'validated' | 'count' | 'new';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badgeText?: string;
  badgeType?: BadgeType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ─── Data ─────────────────────────────────────────────────────

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Compte',
    items: [
      { icon: 'person-outline', label: 'Informations personnelles' },
      { icon: 'shield-outline', label: "Vérification d'identité", badgeText: 'Validée', badgeType: 'validated' },
      { icon: 'card-outline', label: 'Paiements & virements' },
    ],
  },
  {
    title: 'Activité',
    items: [
      { icon: 'heart-outline', label: 'Favoris', badgeText: '12', badgeType: 'count' },
      { icon: 'star-outline', label: 'Mes avis' },
      { icon: 'chatbubble-outline', label: 'Messages', badgeText: '3 nouveaux', badgeType: 'new' },
    ],
  },
  {
    title: 'Aide',
    items: [
      { icon: 'help-circle-outline', label: "Centre d'aide" },
      { icon: 'shield-checkmark-outline', label: 'Assurance & litiges' },
      { icon: 'settings-outline', label: 'Paramètres' },
    ],
  },
];

// ─── Badge ────────────────────────────────────────────────────

function Badge({ text, type }: { text: string; type: BadgeType }) {
  if (type === 'count') {
    return <Text style={styles.badgeCount}>{text}</Text>;
  }
  if (type === 'validated') {
    return (
      <View style={styles.badgeValidated}>
        <Text style={styles.badgeValidatedText}>{text}</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeNew}>
      <Text style={styles.badgeNewText}>{text}</Text>
    </View>
  );
}

// ─── MenuRow ──────────────────────────────────────────────────

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  return (
    <>
      <TouchableOpacity
        style={styles.menuRow}
        activeOpacity={0.7}
        onPress={() =>
          Alert.alert(
            'Bientôt disponible',
            'Cette fonctionnalité sera disponible prochainement.',
            [{ text: 'OK' }],
          )
        }
      >
        <View style={styles.menuIconWrap}>
          <Ionicons name={item.icon} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
        {item.badgeText && item.badgeType && (
          <Badge text={item.badgeText} type={item.badgeType} />
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
      {!isLast && <View style={styles.menuSep} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then(setUser).catch(() => {});
  }, []);

  const displayName = user ? `${user.prenom} ${user.nom}` : '—';
  const initials = user
    ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase()
    : '?';

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Erreur', 'Impossible de se déconnecter.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerBg, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{displayName}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.locationText}>Agadir, Maroc · Membre depuis 2024</Text>
        </View>

        <View style={styles.verifiedBadge}>
          <Ionicons name="star" size={13} color={Colors.secondary} />
          <Text style={styles.verifiedBadgeText}>Profil vérifié</Text>
        </View>
      </View>

      {/* Stats — card unifiée avec séparateurs */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Locations</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
        <View style={styles.statSep} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1 420</Text>
          <Text style={styles.statLabel}>MAD gagnés</Text>
        </View>
      </View>

      {/* Menu sections */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, idx) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={idx === section.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
  },

  // ── Header ──
  headerBg: {
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: Typography.fontDisplay,
    fontSize: 36,
    color: Colors.textInverse,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  userName: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryXLight,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  verifiedBadgeText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.secondary,
  },

  // ── Stats — card unifiée ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: -20,
    paddingVertical: Spacing.lg,
    ...Shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statSep: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statValue: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── Menu ──
  menuSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  menuSectionTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 13,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: Typography.fontSubheading,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  menuSep: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 72,
  },

  // ── Badges ──
  badgeCount: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badgeValidated: {
    backgroundColor: Colors.secondaryXLight,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeValidatedText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 12,
    color: Colors.secondary,
  },
  badgeNew: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeNewText: {
    fontFamily: Typography.fontHeading,
    fontSize: 12,
    color: Colors.primary,
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing['2xl'],
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  logoutText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.error,
  },
});
