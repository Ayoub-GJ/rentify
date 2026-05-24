import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Platform,
  Alert,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, TabActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────

interface FormData {
  photos: string[];
  titre: string;
  description: string;
  categorie: string;
  prixParJour: string;
  ville: string;
}

// ─── StepIndicator ────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          {index > 0 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: current > index ? Colors.primary : Colors.border },
              ]}
            />
          )}
          <View
            style={[
              styles.stepCircle,
              current >= step ? styles.stepCircleActive : styles.stepCircleInactive,
            ]}
          >
            {current > step ? (
              <Ionicons name="checkmark" size={13} color={Colors.textInverse} />
            ) : (
              <Text
                style={[
                  styles.stepNum,
                  current === step ? styles.stepNumActive : styles.stepNumInactive,
                ]}
              >
                {step}
              </Text>
            )}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── AddItemScreen ────────────────────────────────────────────

export default function AddItemScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [formData, setFormData] = useState<FormData>({
    photos: [],
    titre: '',
    description: '',
    categorie: '',
    prixParJour: '',
    ville: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const chipWidth = (screenWidth - Layout.screenPadding * 2 - Spacing.md) / 2;

  // ── Navigation ──

  function goBack() {
    navigation.dispatch(TabActions.jumpTo('Home'));
  }

  function goToStep(nextStep: number) {
    const direction = nextStep > currentStep ? 1 : -1;

    Animated.timing(slideAnim, {
      toValue: direction * -screenWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(direction * screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }

  // ── Validation ──

  function validateStep(step: number): boolean {
    if (step === 1) {
      if (formData.titre.trim().length < 3) {
        Alert.alert('Titre trop court', 'Le titre doit contenir au moins 3 caractères.');
        return false;
      }
      if (formData.description.trim().length < 10) {
        Alert.alert('Description trop courte', 'La description doit contenir au moins 10 caractères.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.categorie) {
        Alert.alert('Catégorie manquante', 'Sélectionne une catégorie pour ton annonce.');
        return false;
      }
      const prix = parseFloat(formData.prixParJour);
      if (!formData.prixParJour || isNaN(prix) || prix <= 0) {
        Alert.alert('Prix invalide', 'Entre un prix par jour supérieur à 0.');
        return false;
      }
      if (formData.ville.trim().length < 2) {
        Alert.alert('Ville manquante', 'Entre la ville où se trouve l\'objet.');
        return false;
      }
    }
    return true;
  }

  // ── Image picker ──

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...result.assets.map(a => a.uri)].slice(0, 5),
      }));
    }
  }, []);

  function removePhoto(index: number) {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  // ── Publish ──

  function publish() {
    console.log('formData:', formData);
    Alert.alert(
      'Annonce publiée !',
      'Elle sera visible sous peu après vérification.',
      [{ text: 'OK', onPress: goBack }],
    );
  }

  // ── Step 1 ──

  function renderStep1() {
    return (
      <View style={styles.stepContent}>
        {/* Zone upload */}
        <TouchableOpacity style={styles.uploadZone} onPress={pickImage} activeOpacity={0.8}>
          <Ionicons name="camera" size={40} color={Colors.textTertiary} />
          <Text style={styles.uploadTitle}>Ajouter des photos</Text>
          <Text style={styles.uploadSub}>Maximum 5 photos</Text>
        </TouchableOpacity>

        {/* Miniatures */}
        {formData.photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosRow}
            contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: 2 }}
          >
            {formData.photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => removePhoto(idx)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Titre */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Titre de l'annonce *</Text>
            <Text style={styles.counter}>{formData.titre.length}/60</Text>
          </View>
          <TextInput
            style={styles.inputPill}
            placeholder="Ex : Perceuse Bosch 18V"
            placeholderTextColor={Colors.textTertiary}
            value={formData.titre}
            onChangeText={t => setFormData(prev => ({ ...prev, titre: t.slice(0, 60) }))}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description *</Text>
            <Text style={styles.counter}>{formData.description.length}/500</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Décrivez l'état, les accessoires inclus..."
            placeholderTextColor={Colors.textTertiary}
            value={formData.description}
            onChangeText={t => setFormData(prev => ({ ...prev, description: t.slice(0, 500) }))}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  }

  // ── Step 2 ──

  function renderStep2() {
    return (
      <View style={styles.stepContent}>
        {/* Catégorie */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Catégorie *</Text>
          <View style={styles.categoryGrid}>
            {Categories.map(cat => {
              const active = formData.categorie === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { width: chipWidth },
                    active ? styles.categoryChipActive : styles.categoryChipInactive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, categorie: cat.id }))}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={active ? Colors.textInverse : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      active ? styles.categoryChipLabelActive : styles.categoryChipLabelInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Prix */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Prix par jour *</Text>
          <View style={styles.inputRow}>
            <Ionicons name="cash-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.inputRowText}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={formData.prixParJour}
              onChangeText={t => setFormData(prev => ({ ...prev, prixParJour: t.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              returnKeyType="next"
            />
            <Text style={styles.inputSuffix}>MAD / jour</Text>
          </View>
        </View>

        {/* Ville */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ville *</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.inputRowText}
              placeholder="Ex : Agadir"
              placeholderTextColor={Colors.textTertiary}
              value={formData.ville}
              onChangeText={t => setFormData(prev => ({ ...prev, ville: t }))}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Step 3 ──

  function renderStep3() {
    const categoryInfo = Categories.find(c => c.id === formData.categorie);
    const firstPhoto = formData.photos[0];

    return (
      <View style={styles.stepContent}>
        {/* Photo de couverture */}
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.recapPhoto} resizeMode="cover" />
        ) : (
          <View style={[styles.recapPhoto, styles.recapPhotoPlaceholder]}>
            <Ionicons name="image-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.recapPhotoPlaceholderText}>Aucune photo</Text>
          </View>
        )}

        {/* Card récap */}
        <View style={styles.recapCard}>
          <View style={styles.recapRow}>
            <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
            <Text style={styles.recapLabel}>Titre</Text>
            <Text style={styles.recapValue} numberOfLines={2}>{formData.titre}</Text>
          </View>
          <View style={styles.recapDivider} />
          <View style={styles.recapRow}>
            {categoryInfo && (
              <Ionicons name={categoryInfo.icon as any} size={18} color={categoryInfo.color} />
            )}
            <Text style={styles.recapLabel}>Catégorie</Text>
            <Text style={styles.recapValue}>{categoryInfo?.label ?? '—'}</Text>
          </View>
          <View style={styles.recapDivider} />
          <View style={styles.recapRow}>
            <Ionicons name="cash-outline" size={18} color={Colors.primary} />
            <Text style={styles.recapLabel}>Prix</Text>
            <Text style={styles.recapValue}>{formData.prixParJour} MAD / jour</Text>
          </View>
          <View style={styles.recapDivider} />
          <View style={styles.recapRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.recapLabel}>Ville</Text>
            <Text style={styles.recapValue}>{formData.ville}</Text>
          </View>
        </View>

        {/* Message info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            Votre annonce sera visible après vérification
          </Text>
        </View>
      </View>
    );
  }

  // ── Render ──

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={currentStep === 1 ? goBack : () => goToStep(currentStep - 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publier un objet</Text>
        <StepIndicator current={currentStep} />
      </View>

      {/* Content with slide animation */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 60}
      >
        <View style={[styles.flex, { overflow: 'hidden' }]}>
          <Animated.View
            style={[styles.flex, { transform: [{ translateX: slideAnim }] }]}
          >
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Bottom buttons */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 12 },
          ]}
        >
          {currentStep === 3 ? (
            <TouchableOpacity
              style={styles.btnPublish}
              onPress={publish}
              activeOpacity={0.88}
            >
              <Text style={styles.btnPrimaryText}>Publier l'annonce</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.btnRow}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={() => goToStep(currentStep - 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnOutlineText}>← Retour</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btnPrimary, currentStep === 1 && styles.btnPrimaryFull]}
                onPress={() => {
                  if (validateStep(currentStep)) goToStep(currentStep + 1);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.btnPrimaryText}>Suivant →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },

  // ── Header ──
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },

  // ── Step indicator ──
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: Colors.border,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepNum: {
    fontFamily: Typography.fontHeading,
    fontSize: 13,
  },
  stepNumActive: {
    color: Colors.textInverse,
  },
  stepNumInactive: {
    color: Colors.textTertiary,
  },

  // ── Scroll content ──
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
  },
  stepContent: {
    gap: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // ── Upload zone ──
  uploadZone: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  uploadTitle: {
    fontFamily: Typography.fontSubheading,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  uploadSub: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  photosRow: {
    marginTop: -Spacing.sm,
  },
  photoThumb: {
    position: 'relative',
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
  },

  // ── Form fields ──
  fieldGroup: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Typography.fontSubheading,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  counter: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  inputPill: {
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // ── Category grid ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryChip: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
  },
  categoryChipLabelActive: {
    color: Colors.textInverse,
  },
  categoryChipLabelInactive: {
    color: Colors.textSecondary,
  },

  // ── Input with icon ──
  inputRow: {
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  inputIcon: {
    flexShrink: 0,
  },
  inputRowText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  inputSuffix: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    flexShrink: 0,
  },

  // ── Recap (step 3) ──
  recapPhoto: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
  },
  recapPhotoPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  recapPhotoPlaceholderText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  recapCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.card,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  recapLabel: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    width: 72,
  },
  recapValue: {
    flex: 1,
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  recapDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },

  // ── Bottom bar ──
  bottomBar: {
    paddingTop: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btnPrimary: {
    flex: 1,
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  btnPrimaryFull: {
    flex: 1,
  },
  btnPublish: {
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  btnPrimaryText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  btnOutline: {
    flex: 1,
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
});
