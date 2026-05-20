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
  Image,
  Keyboard,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { login, resetPassword } from '../../services/authService';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme/theme';

interface LoginScreenProps {
  navigation: any;
}

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'Aucun compte associé à cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (!email.includes('@')) {
      setError('Adresse email invalide.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      const code: string = err?.code ?? '';
      setError(FIREBASE_ERRORS[code] || 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleResetPassword = useCallback(async (emailToReset: string) => {
    const trimmed = emailToReset.trim();
    if (!trimmed) {
      Alert.alert('Champ requis', 'Veuillez entrer votre adresse email.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(trimmed);
      setShowResetModal(false);
      setResetEmail('');
      Alert.alert(
        'Email envoyé !',
        'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.'
      );
    } catch (err: any) {
      const code: string = err?.code ?? '';
      if (code === 'auth/user-not-found') {
        Alert.alert('Introuvable', 'Aucun compte avec cet email.');
      } else if (code === 'auth/invalid-email') {
        Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer l\'email. Réessayez plus tard.');
      }
    } finally {
      setResetLoading(false);
    }
  }, []);

  const handleForgotPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Réinitialiser le mot de passe',
        'Entrez votre email pour recevoir un lien de réinitialisation',
        async (emailInput) => {
          if (emailInput) await handleResetPassword(emailInput);
        },
        'plain-text',
        email
      );
    } else {
      setResetEmail(email);
      setShowResetModal(true);
    }
  }, [email, handleResetPassword]);

  const emailBorderColor = focusedInput === 'email' ? Colors.primary : Colors.border;
  const passwordBorderColor = focusedInput === 'password' ? Colors.primary : Colors.border;

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
            {/* ── Zone haute : fond background + logo ── */}
            <View style={[styles.topZone, isSmallScreen && styles.topZoneSmall]}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.appName}>Rentify</Text>
              <Text style={styles.tagline}>Loue. Partage. Économise.</Text>
            </View>

            {/* ── Zone basse : card blanche ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bon retour !</Text>
              <Text style={styles.cardSubtitle}>Connectez-vous pour continuer</Text>

              {/* Message d'erreur */}
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Input Email */}
              <View style={[styles.inputWrapper, { borderColor: emailBorderColor }]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focusedInput === 'email' ? Colors.primary : Colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
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
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!loading}
                  accessible
                  accessibilityLabel="Adresse email"
                />
              </View>

              {/* Input Mot de passe */}
              <View style={[styles.inputWrapper, { borderColor: passwordBorderColor }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedInput === 'password' ? Colors.primary : Colors.textTertiary}
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
                  autoComplete="current-password"
                  textContentType="password"
                  spellCheck={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
                    color={focusedInput === 'password' ? Colors.primary : Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Mot de passe oublié */}
              <TouchableOpacity
                style={styles.forgotRow}
                onPress={handleForgotPress}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Mot de passe oublié"
              >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              {/* Bouton Se connecter */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Se connecter"
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.primaryButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou continuer avec</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Bouton Google */}
              <TouchableOpacity
                style={styles.googleButton}
                activeOpacity={0.8}
                disabled={loading}
                onPress={() => Alert.alert(
                  'Google Sign-In',
                  'La connexion avec Google sera disponible dans la version finale.',
                  [{ text: 'OK' }]
                )}
                accessibilityRole="button"
                accessibilityLabel="Continuer avec Google"
              >
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </TouchableOpacity>

              {/* Lien inscription */}
              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Pas de compte ? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Signup')}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="S'inscrire"
                >
                  <Text style={styles.signupLink}>S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ── Modal reset password (Android) ── */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowResetModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Mot de passe oublié</Text>
                <Text style={styles.modalSubtitle}>
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </Text>

                <View style={[styles.inputWrapper, { borderColor: Colors.border, marginTop: Spacing.sm }]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.textTertiary}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!resetLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, resetLoading && styles.primaryButtonDisabled, { marginTop: Spacing.lg }]}
                  onPress={() => handleResetPassword(resetEmail)}
                  disabled={resetLoading}
                  activeOpacity={0.85}
                >
                  {resetLoading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Envoyer</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  topZoneSmall: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
  },
  logoContainer: {
    ...Shadows.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 18,
    marginBottom: Spacing.xs,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 18,
  },
  appName: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size['3xl'],
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  tagline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },

  // ── Card blanche ──
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size['2xl'],
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
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

  // ── Mot de passe oublié ──
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
  },
  forgotText: {
    fontFamily: Typography.fontBodyMedium,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },

  // ── Bouton principal ──
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── Modal reset (Android) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
  },
  modalTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.5,
  },
  outlineButton: {
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  outlineButtonText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.lg,
    color: Colors.primary,
  },

  // ── Lien inscription ──
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
});
