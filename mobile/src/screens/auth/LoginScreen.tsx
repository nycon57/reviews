import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, Text, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, isLoading } = useAuth();
  const colors = Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login Error', message);
    }
  }, [email, password, signIn, validate]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="h1" style={styles.title}>
              RepWell
            </Text>
            <Text variant="muted" style={styles.subtitle}>
              Sign in to your account
            </Text>
          </View>

          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={errors.password}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text variant="small" color="muted">
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <Button
                onPress={handleLogin}
                isLoading={isLoading}
                style={styles.button}
              >
                <Text variant="body">Sign In</Text>
              </Button>
            </CardContent>
          </Card>

          <View style={styles.footer}>
            <Text variant="muted">Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text variant="body" style={{ color: colors.primary, marginLeft: 4 }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
  },
  cardContent: {
    paddingTop: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
