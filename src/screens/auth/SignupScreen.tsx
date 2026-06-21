import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { signup } from '../../services/authService';
import { signInWithGoogle } from '../../services/googleAuthService';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface SignupScreenProps {
  navigation: any;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères).',
  'auth/invalid-email': 'Format d\'email invalide.',
};

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<'prenom' | 'nom' | 'email' | 'tel' | 'password' | null>(null);

  const nomRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const telRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignup = useCallback(async () => {
    Keyboard.dismiss();
    setError('');

    const trimmedPrenom = prenom.trim();
    const trimmedEmail = email.trim();

    if (trimmedPrenom.length === 0) {
      setError('Veuillez entrer votre prénom.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Email invalide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: trimmedEmail,
        password,
        prenom: trimmedPrenom,
        nom: nom.trim(),
        telephone: telephone.trim(),
        ville: '',
      });
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || 'Erreur lors de l\'inscription. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [prenom, nom, email, telephone, password]);

  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigation auto via le auth listener existant
    } catch (err: any) {
      if (err?.code === 'SIGN_IN_CANCELLED' || err?.code === '-5') return;
      console.error('[GoogleSignIn]', err);
      Alert.alert('Erreur', 'Impossible de se connecter avec Google. Réessaye.');
    } finally {
      setLoading(false);
    }
  }, []);

  const borderFor = (field: typeof focusedInput) =>
    focusedInput === field ? Colors.primary : Colors.border;

  const iconColorFor = (field: typeof focusedInput) =>
    focusedInput === field ? Colors.primary : Colors.textTertiary;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Zone haute : bouton retour + titres ── */}
            <View style={styles.topZone}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Retour"
              >
                <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Créer un compte</Text>
              <Text style={styles.pageSubtitle}>Rejoignez la communauté Rentify</Text>
            </View>

            {/* ── Card blanche ── */}
            <View style={styles.card}>

              {/* Message d'erreur */}
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Input Prénom */}
              <View style={[styles.inputWrapper, { borderColor: borderFor('prenom') }]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={iconColorFor('prenom')}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom *"
                  placeholderTextColor={Colors.textTertiary}
                  value={prenom}
                  onChangeText={setPrenom}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="given-name"
                  textContentType="givenName"
                  spellCheck={false}
                  returnKeyType="next"
                  onSubmitEditing={() => nomRef.current?.focus()}
                  onFocus={() => setFocusedInput('prenom')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Prénom"
                />
              </View>

              {/* Input Nom */}
              <View style={[styles.inputWrapper, { borderColor: borderFor('nom') }]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={iconColorFor('nom')}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={nomRef}
                  style={styles.input}
                  placeholder="Nom (optionnel)"
                  placeholderTextColor={Colors.textTertiary}
                  value={nom}
                  onChangeText={setNom}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="family-name"
                  textContentType="familyName"
                  spellCheck={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  onFocus={() => setFocusedInput('nom')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Nom"
                />
              </View>

              {/* Input Email */}
              <View style={[styles.inputWrapper, { borderColor: borderFor('email') }]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={iconColorFor('email')}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="Adresse email"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  spellCheck={false}
                  returnKeyType="next"
                  onSubmitEditing={() => telRef.current?.focus()}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Adresse email"
                />
              </View>

              {/* Input Téléphone */}
              <View style={[styles.inputWrapper, { borderColor: borderFor('tel') }]}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={iconColorFor('tel')}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={telRef}
                  style={styles.input}
                  placeholder="Téléphone (optionnel)"
                  placeholderTextColor={Colors.textTertiary}
                  value={telephone}
                  onChangeText={setTelephone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocusedInput('tel')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Numéro de téléphone (optionnel)"
                />
              </View>

              {/* Input Mot de passe */}
              <View style={[styles.inputWrapper, { borderColor: borderFor('password') }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={iconColorFor('password')}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  spellCheck={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Mot de passe"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={iconColorFor('password')}
                  />
                </TouchableOpacity>
              </View>

              {/* Bouton S'inscrire */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="S'inscrire"
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.primaryButtonText}>S'inscrire</Text>
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Bouton Google */}
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleGoogleSignIn}
                accessibilityRole="button"
                accessibilityLabel="Continuer avec Google"
              >
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </TouchableOpacity>

              {/* Texte légal */}
              <Text style={styles.legalText}>
                En créant un compte, vous acceptez nos{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => {}}
                  accessibilityRole="link"
                >
                  Conditions d'utilisation
                </Text>
              </Text>

              {/* Lien connexion */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Déjà inscrit ? </Text>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Se connecter"
                >
                  <Text style={styles.loginLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Zone haute ──
  topZone: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  pageTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pageSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // ── Card blanche ──
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },

  // ── Erreur ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.error,
    flex: 1,
  },

  // ── Inputs ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },

  // ── Bouton principal ──
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    elevation: 2,
    shadowOpacity: 0.15,
  },
  primaryButtonText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
  },

  // ── Séparateur ──
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },

  // ── Bouton Google ──
  googleButton: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  googleButtonText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },

  // ── Texte légal ──
  legalText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.sm * Typography.lineHeight.relaxed,
  },
  legalLink: {
    color: Colors.primary,
    fontFamily: Typography.fontBodyMedium,
  },

  // ── Lien connexion ──
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
});
