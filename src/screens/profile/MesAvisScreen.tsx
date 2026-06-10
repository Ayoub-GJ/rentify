import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase.config';
import { getReviewsByProprietaire } from '../../services/firestoreService';
import StarRating from '../../components/StarRating';
import { Review } from '../../types';
import { formatDateShort } from '../../utils/formatters';
import UserAvatar from '../../components/UserAvatar';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <UserAvatar uid={review.locataireId} size={40} name={review.locataireName ?? ''} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.reviewerName}>{review.locataireName}</Text>
          <Text style={styles.itemTitre} numberOfLines={1}>{review.itemTitre}</Text>
          <Text style={styles.cardDate}>{formatDateShort(review.createdAt)}</Text>
        </View>
      </View>
      <StarRating value={review.rating} size={16} />
      {!!review.commentaire && (
        <Text style={styles.commentaire}>{review.commentaire}</Text>
      )}
    </View>
  );
}

export default function MesAvisScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      setLoading(true);
      getReviewsByProprietaire(uid)
        .then((r) => {
          console.log('[MesAvisScreen] Reviews fetched:', r.length);
          setReviews(r);
        })
        .catch((err) => {
          console.error('[MesAvisScreen] Error fetching reviews:', err);
          setReviews([]);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  const count = reviews.length;
  const average = count > 0
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / count * 10) / 10
    : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes avis ({count})</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : count === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="star-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucun avis pour l'instant</Text>
          <Text style={styles.emptySubtitle}>Vos avis apparaîtront ici après vos locations.</Text>
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryAverage}>{average.toFixed(1)}</Text>
            <StarRating value={average} size={22} />
            <Text style={styles.summaryCount}>{count} avis reçu{count > 1 ? 's' : ''}</Text>
          </View>

          <FlatList
            data={reviews}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <ReviewCard review={item} />}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xl }]}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
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
  summary: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryAverage: {
    fontFamily: Typography.fontDisplay,
    fontSize: 48,
    color: Colors.textPrimary,
    lineHeight: 56,
  },
  summaryCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textInverse,
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  itemTitre: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  cardDate: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  commentaire: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
