import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { HomeStackParamList } from '../../navigation/types';

type NavProp = StackNavigationProp<HomeStackParamList, 'ItemDetail'>;
type RouteType = RouteProp<HomeStackParamList, 'ItemDetail'>;

const MOCK_OWNER = {
  nom: 'Mohammed Alami',
  avis: 47,
  note: 4.9,
};

const FALLBACK_DESCRIPTION =
  'Objet en parfait état, entretenu régulièrement. Idéal pour vos projets ponctuels. Disponible à la location à Agadir. Livraison possible sur Agadir centre. Contactez-moi pour plus d\'informations et disponibilités.';

export default function ItemDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { item } = route.params;
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [isFav, setIsFav] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const description = item.description ?? FALLBACK_DESCRIPTION;
  const isLongDescription = description.length > 120;

  const categoryInfo = Categories.find((c) => c.id === item.categorie);

  const ownerInitials = MOCK_OWNER.nom
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* ── Image hero ── */}
        <View>
          <Image
            source={{ uri: item.images[0] }}
            style={styles.heroImage}
            resizeMode="cover"
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
            onPress={() => setIsFav((v) => !v)}
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

          {/* A. Header item */}
          <View style={styles.section}>
            <Text style={styles.itemTitle}>{item.titre}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{item.prixParJour} MAD</Text>
              <Text style={styles.priceUnit}>/jour</Text>
            </View>

            <View style={styles.statsRow}>
              <Ionicons name="star" size={14} color="#F0A020" />
              <Text style={styles.statsNote}>{item.note}</Text>
              <Text style={styles.statsAvis}>({item.avis} avis)</Text>
              <Text style={styles.statsDot}>·</Text>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.statsVille}>{item.ville}</Text>
            </View>
          </View>

          {/* B. Propriétaire */}
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitials}>{ownerInitials}</Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{MOCK_OWNER.nom}</Text>
              <Text style={styles.ownerLabel}>Propriétaire</Text>
            </View>
            <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
              <Text style={styles.contactButtonText}>Contacter</Text>
            </TouchableOpacity>
          </View>

          {/* C. Description */}
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

          {/* D. Caractéristiques */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailChip}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                <Text style={styles.detailChipText}>Disponible</Text>
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
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'android' ? 20 : insets.bottom + 12,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        elevation: 10,
      }}>
        <View>
          <Text style={{ fontSize: 22, fontFamily: Typography.fontDisplay, color: Colors.primary }}>
            {item.prixParJour} MAD
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textTertiary, fontFamily: Typography.fontBody }}>
            par jour
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.88}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: Radius.full,
            height: 52,
            paddingHorizontal: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontFamily: Typography.fontHeading }}>
            Réserver
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ── Image hero ──
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

  // ── A. Header item ──
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

  // ── B. Propriétaire ──
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

  // ── C. Description ──
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

  // ── D. Caractéristiques ──
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

});
