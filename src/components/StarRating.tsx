import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../theme/theme';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  color?: string;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({
  value,
  onChange,
  size = 20,
  color = Colors.warning,
  showCount = false,
  count,
}: StarRatingProps) {
  const interactive = !!onChange;

  function iconName(index: number): keyof typeof Ionicons.glyphMap {
    if (value >= index + 1) return 'star';
    if (value >= index + 0.5) return 'star-half';
    return 'star-outline';
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    const name = iconName(i);
    const starEl = (
      <Ionicons
        key={i}
        name={name}
        size={size}
        color={name === 'star-outline' ? Colors.textTertiary : color}
      />
    );
    if (interactive) {
      return (
        <TouchableOpacity key={i} onPress={() => onChange!(i + 1)} activeOpacity={0.7}>
          {starEl}
        </TouchableOpacity>
      );
    }
    return starEl;
  });

  return (
    <View style={styles.row}>
      {stars}
      {value > 0 && !interactive && (
        <Text style={[styles.value, { fontSize: size * 0.7 }]}>
          {value % 1 === 0 ? value.toFixed(1) : value}
        </Text>
      )}
      {showCount && count !== undefined && count > 0 && (
        <Text style={[styles.count, { fontSize: size * 0.65 }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontFamily: Typography.fontBodyMedium,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  count: {
    fontFamily: Typography.fontBody,
    color: Colors.textTertiary,
  },
});
