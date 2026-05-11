import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  ref?: React.Ref<TextInput>;
}

export function Input({ label, error, helperText, style, ref, ...props }: InputProps) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
});
