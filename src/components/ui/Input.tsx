import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Layout, Spacing } from '../../theme';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  leftIcon,
  rightIcon,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const containerStyle = [
    styles.inputContainer,
    focused && styles.inputFocused,
    !!error && styles.inputError,
  ] as ViewStyle[];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={containerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, rightIcon ? styles.inputWithRight : null]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
  },

  inputFocused: {
    borderColor: Colors.primary,
  },

  inputError: {
    borderColor: Colors.error,
  },

  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  inputWithLeft: {
    marginLeft: Spacing.sm,
  },

  inputWithRight: {
    marginRight: Spacing.sm,
  },

  leftIcon: {
    marginRight: 0,
  },

  rightIcon: {
    marginLeft: 0,
  },

  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: Spacing.lg,
  },
});
