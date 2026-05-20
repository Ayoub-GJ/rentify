import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Shadows, Layout, Spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
  ] as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
  },

  // Tailles
  size_sm: { height: Layout.buttonHeight.sm, paddingHorizontal: Spacing.xl },
  size_md: { height: Layout.buttonHeight.md },
  size_lg: { height: Layout.buttonHeight.lg },

  // Variantes
  variant_primary: {
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  variant_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },

  disabled: {
    opacity: 0.5,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    marginRight: Spacing.sm,
  },

  text: {
    fontFamily: 'Poppins_600SemiBold',
  },

  // Couleur texte par variante
  text_primary: { color: Colors.textInverse },
  text_secondary: { color: Colors.primary },
  text_ghost: { color: Colors.primary },

  // Taille texte par size
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
