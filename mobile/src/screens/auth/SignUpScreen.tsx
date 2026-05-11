import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, Text, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, isLoading } = useAuth();
  const colors = Colors.light;

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const updateField = useCallback((field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSignUp = useCallback(async () => {
    if (!validate()) return;

    try {
      await signUp(form.email.trim(), form.password, form.name.trim());
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      Alert.alert('Sign Up Error', message);
    }
  }, [form, signUp, validate, navigation]);

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
              Create your account
            </Text>
          </View>

          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                value={form.name}
                onChangeText={(name) => updateField('name', name)}
                error={errors.name}
              />

              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.email}
                onChangeText={(email) => updateField('email', email)}
                error={errors.email}
              />

              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={form.password}
                onChangeText={(password) => updateField('password', password)}
                error={errors.password}
                helperText="At least 8 characters"
              />

              <Input
                label="Confirm Password"
                placeholder="••••••••"
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={(confirmPassword) => updateField('confirmPassword', confirmPassword)}
                error={errors.confirmPassword}
              />

              <Button
                onPress={handleSignUp}
                isLoading={isLoading}
                style={styles.button}
              >
                <Text variant="body">Create Account</Text>
              </Button>
            </CardContent>
          </Card>

          <View style={styles.footer}>
            <Text variant="muted">Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text variant="body" style={{ color: colors.primary, marginLeft: 4 }}>
                Sign In
              </Text>
            </Pressable>
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
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
