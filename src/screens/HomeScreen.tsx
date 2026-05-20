import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { logout } from '../services/authService';

export default function HomeScreen() {
  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
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
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Accueil (placeholder)</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Se déconnecter (test)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  button: {
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  buttonText: {
    fontFamily: Typography.fontHeading,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
});
