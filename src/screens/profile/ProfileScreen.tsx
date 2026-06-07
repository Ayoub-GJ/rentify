import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SmartImage from '../../components/SmartImage';
import { logout } from '../../services/authService';
import {
  getUserById,
  updateUserProfile,
  uploadUserAvatar,
  getUserStats,
  UserStats,
} from '../../services/firestoreService';
import { useFavorites } from '../../contexts/FavoritesContext';
import { auth } from '../../config/firebase.config';
import { User } from '../../types';
import { fullName, getInitials, avatarColorFromUid } from '../../utils/formatters';
import { Colors, Typography, Spacing, Radius, Shadows, Layout } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

type EditableField = 'prenom' | 'nom' | 'telephone' | 'ville';

const FIELD_LABELS: Record<EditableField, string> = {
  prenom: 'Prénom',
  nom: 'Nom',
  telephone: 'Téléphone',
  ville: 'Ville',
};

// ─── Sub-components ───────────────────────────────────────────

function ActionRow({
  icon,
  label,
  onPress,
  badge,
  dimmed,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: string;
  dimmed?: boolean;
  isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity
        style={[styles.menuRow, dimmed && styles.menuRowDimmed]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={20} color={dimmed ? Colors.textTertiary : Colors.primary} />
        </View>
        <Text style={[styles.menuLabel, dimmed && styles.menuLabelDimmed]}>{label}</Text>
        {badge !== undefined && (
          <Text style={styles.badgeCount}>{badge}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
      {!isLast && <View style={styles.menuSep} />}
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  hasValue,
  onPress,
  readonly,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hasValue: boolean;
  onPress?: () => void;
  readonly?: boolean;
}) {
  const inner = (
    <>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.infoRowContent}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={[styles.infoRowValue, !hasValue && styles.infoRowValueEmpty]}>
          {value}
        </Text>
      </View>
      {!readonly && <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
    </>
  );

  if (readonly) return <View style={styles.menuRow}>{inner}</View>;
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      {inner}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  const { favoriteIds } = useFavorites();
  const favoritesCount = favoriteIds.size;

  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit field modal
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editModalValue, setEditModalValue] = useState('');

  // Settings modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      setLoading(true);
      Promise.all([getUserById(uid), getUserStats(uid)]).then(([p, s]) => {
        setProfile(p);
        setStats(s);
        setLoading(false);
      });
    }, []),
  );

  const uid = auth.currentUser?.uid ?? '';

  // ── Avatar ──

  const handlePickAvatar = async () => {
    if (!uid) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const url = await uploadUserAvatar(result.assets[0].uri, uid);
        await updateUserProfile(uid, { photoURL: url });
        setProfile(prev => prev ? { ...prev, photoURL: url } : prev);
      } catch {
        Alert.alert('Erreur', "Impossible de mettre à jour l'avatar.");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  // ── Edit field ──

  function openEdit(field: EditableField, currentValue: string) {
    setEditModalValue(currentValue);
    setEditingField(field);
  }

  async function handleSaveField() {
    if (!editingField || !uid) return;
    try {
      await updateUserProfile(uid, { [editingField]: editModalValue });
      setProfile(prev => prev ? { ...prev, [editingField]: editModalValue } : prev);
      setEditingField(null);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  }

  // ── Logout ──

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

  // ── Loading / error ──

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingRoot}>
        <Ionicons name="person-circle-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.errorText}>Profil introuvable</Text>
      </View>
    );
  }

  // ── Dérivés ──

  const memberYear = profile.createdAt instanceof Date && !isNaN(profile.createdAt.getTime())
    ? profile.createdAt.getFullYear()
    : 2026;
  const locationLine = profile.ville
    ? `${profile.ville} · Membre depuis ${memberYear}`
    : `Membre depuis ${memberYear}`;

  const avatarBgColor = avatarColorFromUid(uid);
  const initials = getInitials(profile);
  const displayName = fullName(profile);

  // ── Render ──

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.headerBg, { paddingTop: insets.top + 16 }]}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarBgColor }]}>
              {profile.photoURL ? (
                <SmartImage uri={profile.photoURL} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              <Ionicons name="camera-outline" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{locationLine}</Text>
          </View>
        </View>

        {/* ── Stats card ── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.itemsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.rentalsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.earningsTotal ?? 0}</Text>
            <Text style={styles.statLabel}>MAD gagnés</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(stats?.reviewsCount ?? 0) > 0 ? `★ ${stats!.averageRating.toFixed(1)}` : '—'}
            </Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>

        {/* ── Mes informations ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Mes informations</Text>
          <View style={styles.menuCard}>
            <InfoRow
              icon="person-outline"
              label="Prénom"
              value={profile.prenom || 'Non renseigné'}
              hasValue={!!profile.prenom}
              onPress={() => openEdit('prenom', profile.prenom ?? '')}
            />
            <View style={styles.menuSep} />
            <InfoRow
              icon="people-outline"
              label="Nom"
              value={profile.nom || 'Non renseigné'}
              hasValue={!!profile.nom}
              onPress={() => openEdit('nom', profile.nom ?? '')}
            />
            <View style={styles.menuSep} />
            <InfoRow
              icon="call-outline"
              label="Téléphone"
              value={profile.telephone || 'Non renseigné'}
              hasValue={!!profile.telephone}
              onPress={() => openEdit('telephone', profile.telephone ?? '')}
            />
            <View style={styles.menuSep} />
            <InfoRow
              icon="location-outline"
              label="Ville"
              value={profile.ville || 'Non renseignée'}
              hasValue={!!profile.ville}
              onPress={() => openEdit('ville', profile.ville ?? '')}
            />
            <View style={styles.menuSep} />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={profile.email}
              hasValue={true}
              readonly
            />
          </View>
        </View>

        {/* ── Section COMPTE ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Compte</Text>
          <View style={styles.menuCard}>
            <ActionRow
              icon="card-outline"
              label="Paiements & virements"
              dimmed
              isLast
              onPress={() =>
                Alert.alert(
                  'Bientôt disponible',
                  'Les paiements en ligne seront disponibles dans une prochaine version.',
                )
              }
            />
          </View>
        </View>

        {/* ── Section ACTIVITÉ ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Activité</Text>
          <View style={styles.menuCard}>
            <ActionRow
              icon="chatbubble-outline"
              label="Messages"
              onPress={() =>
                (navigation as any).navigate('Home', { screen: 'Messages' })
              }
            />
            <ActionRow
              icon="heart-outline"
              label="Favoris"
              badge={favoritesCount > 0 ? String(favoritesCount) : undefined}
              onPress={() => (navigation as any).navigate('MesFavoris')}
            />
            <ActionRow
              icon="star-outline"
              label="Mes avis"
              badge={(stats?.reviewsCount ?? 0) > 0 ? String(stats!.reviewsCount) : undefined}
              isLast
              onPress={() => (navigation as any).navigate('MesAvis')}
            />
          </View>
        </View>

        {/* ── Section AIDE ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Aide</Text>
          <View style={styles.menuCard}>
            <ActionRow
              icon="help-circle-outline"
              label="Centre d'aide"
              onPress={() =>
                Alert.alert(
                  "Centre d'aide",
                  'Pour toute question, contactez-nous à support@rentify.app',
                )
              }
            />
            <ActionRow
              icon="settings-outline"
              label="Paramètres"
              isLast
              onPress={() => setSettingsVisible(true)}
            />
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit field modal ── */}
      <Modal visible={editingField !== null} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setEditingField(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Modifier {editingField ? FIELD_LABELS[editingField].toLowerCase() : ''}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editModalValue}
              onChangeText={setEditModalValue}
              autoFocus
              keyboardType={editingField === 'telephone' ? 'phone-pad' : 'default'}
              returnKeyType="done"
              onSubmitEditing={handleSaveField}
              placeholderTextColor={Colors.textTertiary}
              placeholder={editingField ? `Entrez votre ${FIELD_LABELS[editingField].toLowerCase()}` : ''}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setEditingField(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleSaveField}
                activeOpacity={0.88}
              >
                <Text style={styles.modalBtnSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Settings modal ── */}
      <Modal visible={settingsVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.settingsBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSettingsVisible(false)} />
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Paramètres</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuCard}>
              {/* Notifications */}
              <View style={styles.settingsRow}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              </View>
              <View style={styles.menuSep} />

              {/* Mode sombre — désactivé */}
              <View style={[styles.settingsRow, styles.menuRowDimmed]}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="moon-outline" size={20} color={Colors.textTertiary} />
                </View>
                <Text style={[styles.menuLabel, styles.menuLabelDimmed]}>Mode sombre</Text>
                <Switch
                  value={false}
                  onValueChange={() =>
                    Alert.alert('Bientôt disponible', 'Le mode sombre sera disponible dans une prochaine version.')
                  }
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              </View>
              <View style={styles.menuSep} />

              {/* Version */}
              <View style={styles.settingsRow}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>Version de l'app</Text>
                <Text style={styles.settingsRowValue}>1.0.0</Text>
              </View>
              <View style={styles.menuSep} />

              {/* Politique */}
              <TouchableOpacity
                style={styles.settingsRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    'Politique de confidentialité',
                    'Vos données sont stockées de façon sécurisée sur Firebase et ne sont jamais partagées avec des tiers.',
                  )
                }
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name="shield-outline" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>Politique de confidentialité</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const AVATAR_SIZE = Layout.avatarSize.xl;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
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
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarInitials: {
    fontFamily: Typography.fontDisplay,
    fontSize: 36,
    color: Colors.textInverse,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── Stats card ──
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
    fontSize: 20,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── Info rows ──
  infoRowContent: {
    flex: 1,
    gap: 2,
  },
  infoRowLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  infoRowValue: {
    fontFamily: Typography.fontSubheading,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  infoRowValueEmpty: {
    color: Colors.textTertiary,
    fontFamily: Typography.fontBody,
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
  menuRowDimmed: {
    opacity: 0.5,
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
  menuLabelDimmed: {
    color: Colors.textTertiary,
  },
  menuSep: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 72,
  },
  badgeCount: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    color: Colors.textSecondary,
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

  // ── Edit modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  modalInput: {
    height: Layout.inputHeight,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalBtnCancel: {
    flex: 1,
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  modalBtnSave: {
    flex: 1,
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  modalBtnSaveText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },

  // ── Settings modal ──
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  settingsTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  settingsRowValue: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
});
