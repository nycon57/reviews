import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const colors = Colors.light;

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.primary,
    },
    destructive: {
      backgroundColor: colors.destructive,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    link: {
      backgroundColor: 'transparent',
    },
  };

  const variantTextStyles: Record<string, TextStyle> = {
    default: {
      color: colors.primaryForeground,
    },
    destructive: {
      color: colors.destructiveForeground,
    },
    outline: {
      color: colors.foreground,
    },
    secondary: {
      color: colors.secondaryForeground,
    },
    ghost: {
      color: colors.foreground,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  };

  const sizeStyles: Record<string, ViewStyle> = {
    default: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    lg: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      padding: 0,
    },
  };

  const sizeTextStyles: Record<string, TextStyle> = {
    default: {
      fontSize: 14,
    },
    sm: {
      fontSize: 12,
    },
    lg: {
      fontSize: 16,
    },
    icon: {
      fontSize: 14,
    },
  };

  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantTextStyles[variant].color}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyles[variant],
            sizeTextStyles[size],
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
