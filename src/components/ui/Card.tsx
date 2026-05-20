import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'media';
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'default',
}: CardProps) {
  const cardStyle = [
    styles.base,
    variant === 'default' ? styles.default : styles.media,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },

  default: {
    padding: Spacing.lg,
  },

  media: {
    overflow: 'hidden',
  },
});
