import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase.config';
import { createReview } from '../services/firestoreService';
import { fullName, getInitials, avatarColorFromUid } from '../utils/formatters';
import StarRating from './StarRating';
import { Colors, Typography, Spacing, Radius, Shadows, Layout } from '../theme/theme';
import type { RentalData } from '../services/firestoreService';
import type { User } from '../types';

const RATING_LABELS: Record<number, string> = {
  1: 'Très décevant',
  2: 'Décevant',
  3: 'Correct',
  4: 'Bien',
  5: 'Excellent ✨',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  rental: RentalData;
  proprietaire: User | null;
  onSubmitSuccess: () => void;
}

export default function ReviewModal({ visible, onClose, rental, proprietaire, onSubmitSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setRating(0);
    setCommentaire('');
  }

  async function handleSubmit() {
    const currentUser = auth.currentUser;
    if (!currentUser || rating === 0) return;
    setLoading(true);
    try {
      await createReview({
        rentalId: rental.id,
        itemId: rental.itemId,
        itemTitre: rental.itemTitre,
        proprietaireId: rental.proprietaireId,
        locataireId: currentUser.uid,
        locataireName: currentUser.displayName ?? 'Utilisateur',
        rating,
        commentaire: commentaire.trim(),
      });
      Alert.alert('Merci !', 'Votre avis a bien été publié.', [
        {
          text: 'OK',
          onPress: () => {
            reset();
            onClose();
            onSubmitSuccess();
          },
        },
      ]);
    } catch (e: any) {
      if (e.message === 'REVIEW_ALREADY_EXISTS') {
        Alert.alert('Avis déjà publié', 'Vous avez déjà laissé un avis pour cette location.');
      } else {
        Alert.alert('Erreur', "Impossible de publier l'avis. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  const propName = fullName(proprietaire);
  const propInitials = getInitials(proprietaire);
  const propColor = avatarColorFromUid(rental.proprietaireId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} activeOpacity={0.7} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Évaluer votre location</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Propriétaire */}
          <View style={styles.ownerRow}>
            <View style={[styles.ownerAvatar, { backgroundColor: propColor }]}>
              <Text style={styles.ownerInitials}>{propInitials}</Text>
            </View>
            <View>
              <Text style={styles.ownerName}>{propName}</Text>
              <Text style={styles.ownerSub} numberOfLines={1}>
                Vous avez loué : {rental.itemTitre}
              </Text>
            </View>
          </View>

          {/* Stars */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Comment évaluez-vous cette expérience ?</Text>
            <StarRating value={rating} onChange={setRating} size={40} />
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          {/* Commentaire */}
          <View style={styles.section}>
            <View style={styles.commentHeaderRow}>
              <Text style={styles.sectionLabel}>Commentaire</Text>
              <Text style={styles.optional}>(optionnel)</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={commentaire}
              onChangeText={(t) => t.length <= 500 && setCommentaire(t)}
              multiline
              placeholder="Partagez votre expérience..."
              placeholderTextColor={Colors.textTertiary}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{commentaire.length}/500</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity
            style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.submitBtnText}>Publier mon avis</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  body: {
    padding: Spacing.xl,
    gap: Spacing['2xl'],
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitials: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textInverse,
  },
  ownerName: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  ownerSub: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  section: {
    gap: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  ratingLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.warning,
    marginTop: -Spacing.xs,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optional: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    height: 120,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  charCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: -Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    height: Layout.buttonHeight.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
});
