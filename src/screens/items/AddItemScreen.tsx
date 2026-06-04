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
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, TabActions, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase.config';
import {
  createItem,
  uploadItemImages,
  updateItem,
  getItemById,
  softDeleteItem,
} from '../../services/firestoreService';
import { Categorie } from '../../types';
import { fullName, getInitials } from '../../utils/formatters';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Categories,
} from '../../theme/theme';
import { MainTabParamList } from '../../navigation/types';

// ─── Types ────────────────────────────────────────────────────

interface FormData {
  photos: string[];
  titre: string;
  description: string;
  categorie: string;
  prixParJour: string;
  ville: string;
  periodeMin: string;
}

const EMPTY_FORM: FormData = {
  photos: [],
  titre: '',
  description: '',
  categorie: '',
  prixParJour: '',
  ville: '',
  periodeMin: '1',
};

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
  const route = useRoute<RouteProp<MainTabParamList, 'AddItem'>>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  // Tracks which itemId we've already loaded to avoid reloading on every focus
  const loadedItemIdRef = useRef<string | null>(null);

  const isEditMode = editingItemId !== null;

  useFocusEffect(
    useCallback(() => {
      const itemId = route.params?.itemId ?? null;

      if (itemId) {
        // Edit mode: only load if different item
        if (loadedItemIdRef.current !== itemId) {
          loadedItemIdRef.current = itemId;
          setEditingItemId(itemId);
          setCurrentStep(1);
          slideAnim.setValue(0);
          setLoadingItem(true);
          getItemById(itemId).then((item) => {
            if (item) {
              setFormData({
                photos: item.images && item.images.length > 0 ? item.images : item.photoUrl ? [item.photoUrl] : [],
                titre: item.titre,
                description: item.description ?? '',
                categorie: item.categorie ?? '',
                prixParJour: String(item.prixParJour),
                ville: item.ville,
                periodeMin: String(item.periodeMin ?? 1),
              });
            }
            setLoadingItem(false);
          });
        }
      } else {
        // Create mode: reset every time we land here fresh
        if (loadedItemIdRef.current !== null) {
          loadedItemIdRef.current = null;
        }
        setEditingItemId(null);
        setFormData(EMPTY_FORM);
        setCurrentStep(1);
        setUploading(false);
        slideAnim.setValue(0);
      }
    }, [route.params?.itemId, slideAnim]),
  );

  const chipWidth = (screenWidth - Layout.screenPadding * 2 - Spacing.md) / 2;

  // ── Navigation ──

  function goBack() {
    if (isEditMode) {
      navigation.goBack();
    } else {
      navigation.dispatch(TabActions.jumpTo('Home'));
    }
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
        Alert.alert('Ville manquante', "Entre la ville où se trouve l'objet.");
        return false;
      }
      const pm = parseInt(formData.periodeMin, 10);
      if (!formData.periodeMin || isNaN(pm) || pm < 1) {
        Alert.alert('Période invalide', 'La période minimum doit être au moins 1 jour.');
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

  // ── Submit (create or update) ──

  async function handleSubmit() {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return;
    }
    if (!formData.titre.trim() || !formData.description.trim() || !formData.prixParJour || !formData.categorie || !formData.ville.trim()) {
      Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires.');
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser;
      const newLocalPhotos = formData.photos.filter(p => !p.startsWith('http'));
      const existingRemotePhotos = formData.photos.filter(p => p.startsWith('http'));

      if (isEditMode && editingItemId) {
        // Upload new local images only
        let updatedImages = existingRemotePhotos;
        if (newLocalPhotos.length > 0) {
          const newUrls = await uploadItemImages(newLocalPhotos, editingItemId);
          updatedImages = [...existingRemotePhotos, ...newUrls];
        }
        await updateItem(editingItemId, {
          titre: formData.titre,
          description: formData.description,
          categorie: formData.categorie as unknown as Categorie,
          prixParJour: parseFloat(formData.prixParJour),
          ville: formData.ville,
          periodeMin: parseInt(formData.periodeMin, 10) || 1,
          ...(updatedImages.length > 0 ? { images: updatedImages } : {}),
        });
        setUploading(false);
        loadedItemIdRef.current = null;
        Alert.alert('Succès', 'Votre annonce a été modifiée !', [
          { text: 'OK', onPress: goBack },
        ]);
      } else {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const nomComplet = fullName({ prenom: userData?.prenom, nom: userData?.nom });
        const initiales = getInitials({ prenom: userData?.prenom, nom: userData?.nom });

        const itemId = await createItem({
          titre: formData.titre,
          description: formData.description,
          categorie: formData.categorie as unknown as Categorie,
          prixParJour: parseFloat(formData.prixParJour),
          ville: formData.ville,
          photoUrl: '',
          ownerId: user.uid,
          proprietaireId: user.uid,
          proprietaire: { nom: nomComplet, initiales },
          actif: true,
          datePublication: new Date(),
          periodeMin: parseInt(formData.periodeMin, 10) || 1,
        });

        if (formData.photos.length > 0) {
          const downloadURLs = await uploadItemImages(formData.photos, itemId);
          await updateItem(itemId, { images: downloadURLs });
        }

        setUploading(false);
        Alert.alert('Succès', 'Votre objet a été publié !', [
          { text: 'OK', onPress: goBack },
        ]);
      }
    } catch {
      setUploading(false);
      Alert.alert('Erreur', 'Une erreur est survenue. Réessayez.');
    }
  }

  // ── Delete ──

  function handleDelete() {
    if (!editingItemId) return;
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              await softDeleteItem(editingItemId);
              setUploading(false);
              loadedItemIdRef.current = null;
              Alert.alert('Annonce supprimée', 'Votre annonce a été supprimée.', [
                { text: 'OK', onPress: goBack },
              ]);
            } catch {
              setUploading(false);
              Alert.alert('Erreur', "Impossible de supprimer l'annonce.");
            }
          },
        },
      ],
    );
  }

  // ── Step 1 ──

  function renderStep1() {
    return (
      <View style={styles.stepContent}>
        <TouchableOpacity style={styles.uploadZone} onPress={pickImage} activeOpacity={0.8}>
          <Ionicons name="camera" size={40} color={Colors.textTertiary} />
          <Text style={styles.uploadTitle}>Ajouter des photos</Text>
          <Text style={styles.uploadSub}>Maximum 5 photos</Text>
        </TouchableOpacity>

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
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Période minimum *</Text>
          <View style={styles.inputRow}>
            <Ionicons name="time-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.inputRowText}
              placeholder="1"
              placeholderTextColor={Colors.textTertiary}
              value={formData.periodeMin}
              onChangeText={t => setFormData(prev => ({ ...prev, periodeMin: t.replace(/[^0-9]/g, '') || '1' }))}
              keyboardType="numeric"
              returnKeyType="done"
            />
            <Text style={styles.inputSuffix}>jours min.</Text>
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
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.recapPhoto} resizeMode="cover" />
        ) : (
          <View style={[styles.recapPhoto, styles.recapPhotoPlaceholder]}>
            <Ionicons name="image-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.recapPhotoPlaceholderText}>Aucune photo</Text>
          </View>
        )}

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

        {isEditMode && (
          <TouchableOpacity
            style={[styles.btnDelete, uploading && { opacity: 0.5 }]}
            onPress={handleDelete}
            activeOpacity={0.85}
            disabled={uploading}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.btnDeleteText}>Supprimer l'annonce</Text>
          </TouchableOpacity>
        )}

        {!isEditMode && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>Votre annonce sera visible après vérification</Text>
          </View>
        )}
      </View>
    );
  }

  // ── Render ──

  if (loadingItem) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={currentStep === 1 ? goBack : () => goToStep(currentStep - 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Modifier l'annonce" : 'Publier un objet'}
        </Text>
        <StepIndicator current={currentStep} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 60}
      >
        <View style={[styles.flex, { overflow: 'hidden' }]}>
          <Animated.View style={[styles.flex, { transform: [{ translateX: slideAnim }] }]}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        {currentStep === 3 ? (
          <TouchableOpacity
            style={[styles.btnPublish, uploading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.88}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {isEditMode ? 'Enregistrer les modifications' : "Publier l'annonce"}
              </Text>
            )}
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
  btnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: Layout.buttonHeight.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  btnDeleteText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.error,
  },

  // ── Bottom bar ──
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
