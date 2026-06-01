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

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
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
      { icon: 'notifications-outline', label: 'Notifications' },
      { icon: 'shield-checkmark-outline', label: 'Sécurité' },
    ],
  },
  {
    title: 'Préférences',
    items: [
      { icon: 'language-outline', label: 'Langue (Français)' },
      { icon: 'moon-outline', label: 'Apparence' },
    ],
  },
  {
    title: 'Aide',
    items: [
      { icon: 'help-circle-outline', label: "Centre d'aide" },
      { icon: 'chatbubble-outline', label: 'Nous contacter' },
      { icon: 'document-text-outline', label: "Conditions d'utilisation" },
    ],
  },
];

const MOCK_STATS = [
  { value: '12', label: 'Locations effectuées' },
  { value: '5', label: 'Objets publiés' },
  { value: '4.8', label: 'Note moyenne' },
];

// ─── Sub-components ───────────────────────────────────────────

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  return (
    <>
      <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={item.icon} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
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
  const email = user?.email ?? '—';
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
        <Text style={styles.userEmail}>{email}</Text>
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
          <Text style={styles.verifiedText}>Vérifié</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {MOCK_STATS.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} />
        ))}
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

  // Header
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
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: 13,
    color: Colors.secondary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: -20,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
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

  // Menu
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

  // Logout
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
