import React from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'muted';
  color?: 'default' | 'muted' | 'destructive' | 'success';
}

export function Text({
  variant = 'body',
  color = 'default',
  style,
  children,
  ...props
}: TextProps) {
  const colors = Colors.light;

  const variantStyles: Record<string, TextStyle> = {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: -0.25,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h4: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22,
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
    },
    muted: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22,
    },
  };

  const colorStyles: Record<string, TextStyle> = {
    default: {
      color: colors.foreground,
    },
    muted: {
      color: colors.mutedForeground,
    },
    destructive: {
      color: colors.destructive,
    },
    success: {
      color: colors.success,
    },
  };

  return (
    <RNText
      style={[
        variantStyles[variant],
        colorStyles[color],
        variant === 'muted' && colorStyles.muted,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({});
