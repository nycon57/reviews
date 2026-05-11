import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import {
  Text,
  Icon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from '../../components/ui';
import { Colors } from '../../constants/colors';
import {
  createVideoTestimonialRequest,
  getProfessionals,
  getUserProfile,
} from '../../lib/video-testimonials';
import type { Professional } from '../../types';

interface FormErrors {
  professional?: string;
  customerName?: string;
  customerEmail?: string;
}

interface CreateRequestState {
  isLoading: boolean;
  submitting: boolean;
  professionals: Professional[];
  userProfessionalId: string | null;
  selectedProfessional: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  maxDuration: string;
  promptText: string;
  errors: FormErrors;
}

const initialCreateRequestState: CreateRequestState = {
  isLoading: false,
  submitting: false,
  professionals: [],
  userProfessionalId: null,
  selectedProfessional: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  maxDuration: '120',
  promptText: '',
  errors: {},
};

export function CreateRequestScreen({ navigation }: { navigation: any }) {
  const colors = Colors.light;
  const [state, setState] = useState<CreateRequestState>(initialCreateRequestState);

  const updateState = useCallback((nextState: Partial<CreateRequestState>) => {
    setState((current) => ({ ...current, ...nextState }));
  }, []);

  const updateErrors = useCallback((nextErrors: FormErrors) => {
    setState((current) => ({ ...current, errors: { ...current.errors, ...nextErrors } }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        updateState({ isLoading: true });

        // Fetch profile and professionals in parallel for better performance
        const [profile, professionalList] = await Promise.all([
          getUserProfile(),
          getProfessionals(),
        ]);

        let selectedProfessional = '';
        let userProfessionalId: string | null = null;
        if (profile?.role === 'user') {
          const userProfessional = professionalList.find(p => p.user_id === profile.id);
          if (userProfessional) {
            selectedProfessional = userProfessional.id;
            userProfessionalId = userProfessional.id;
          }
        } else if (professionalList.length === 1) {
          selectedProfessional = professionalList[0].id;
        }

        updateState({ professionals: professionalList, selectedProfessional, userProfessionalId });
      } catch (err) {
        console.error('Error loading data:', err);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        updateState({ isLoading: false });
      }
    }
    fetchData();
  }, [updateState]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!state.selectedProfessional) {
      newErrors.professional = 'Please select a professional';
    }

    if (!state.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!state.customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    updateState({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  }, [state.selectedProfessional, state.customerName, state.customerEmail, updateState]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      updateState({ submitting: true });

      await createVideoTestimonialRequest({
        user_id: state.selectedProfessional,
        customer_name: state.customerName.trim(),
        customer_email: state.customerEmail.trim().toLowerCase(),
        customer_phone: state.customerPhone.trim() || undefined,
        max_duration_seconds: parseInt(state.maxDuration) || 120,
        prompt_text: state.promptText.trim() || undefined,
      });

      Alert.alert(
        'Request Sent',
        `Video testimonial request has been sent to ${state.customerName}. They will receive an email with instructions.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('Error creating request:', err);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      updateState({ submitting: false });
    }
  }, [
    validateForm,
    state,
    navigation,
    updateState,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text variant="h4">Send Request</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="muted" style={styles.description}>
            Send a video testimonial request to a customer. They&apos;ll receive an email with a link to record their testimonial.
          </Text>

          {/* Professional Selection */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>Professional</CardTitle>
            </CardHeader>
            <CardContent>
              {state.userProfessionalId ? (
                <View style={styles.selectedProfessional}>
                  <Icon name="person" size={20} color={colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    {state.professionals.find(p => p.id === state.userProfessionalId)?.full_name || 'You'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: state.errors.professional ? colors.destructive : colors.border }]}>
                  <Picker
                    selectedValue={state.selectedProfessional}
                    onValueChange={(value: string) => {
                      updateState({ selectedProfessional: value });
                      if (state.errors.professional) {
                        updateErrors({ professional: undefined });
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select professional…" value="" />
                    {state.professionals.map((prof) => (
                      <Picker.Item key={prof.id} label={prof.full_name} value={prof.id} />
                    ))}
                  </Picker>
                </View>
              )}
              {state.errors.professional && (
                <Text variant="small" style={[styles.errorText, { color: colors.destructive }]}>
                  {state.errors.professional}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                label="Customer Name"
                placeholder="John Smith"
                value={state.customerName}
                onChangeText={(text) => {
                  updateState({ customerName: text });
                  if (state.errors.customerName) {
                    updateErrors({ customerName: undefined });
                  }
                }}
                error={state.errors.customerName}
                autoCapitalize="words"
              />

              <View style={styles.inputSpacing} />

              <Input
                label="Email Address"
                placeholder="customer@example.com"
                value={state.customerEmail}
                onChangeText={(text) => {
                  updateState({ customerEmail: text });
                  if (state.errors.customerEmail) {
                    updateErrors({ customerEmail: undefined });
                  }
                }}
                error={state.errors.customerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.inputSpacing} />

              <Input
                label="Phone (Optional)"
                placeholder="(555) 123-4567"
                value={state.customerPhone}
                onChangeText={(customerPhone) => updateState({ customerPhone })}
                keyboardType="phone-pad"
              />
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="small" color="muted" style={styles.fieldLabel}>
                Maximum Duration
              </Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <Picker
                  selectedValue={state.maxDuration}
                  onValueChange={(maxDuration) => updateState({ maxDuration })}
                  style={styles.picker}
                >
                  <Picker.Item label="1 minute" value="60" />
                  <Picker.Item label="2 minutes (Recommended)" value="120" />
                  <Picker.Item label="3 minutes" value="180" />
                  <Picker.Item label="5 minutes" value="300" />
                </Picker>
              </View>

              <View style={styles.inputSpacing} />

              <Input
                label="Custom Prompt (Optional)"
                placeholder="What would you like the customer to talk about?"
                value={state.promptText}
                onChangeText={(promptText) => updateState({ promptText })}
                multiline
                numberOfLines={3}
                helperText="This will be shown to the customer before they start recording"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleSubmit}
              isLoading={state.submitting}
              disabled={state.isLoading}
              style={styles.submitButton}
            >
              <Text variant="body" style={{ color: colors.primaryForeground }}>Send Request</Text>
            </Button>
            <Text variant="small" color="muted" style={styles.submitHint}>
              The customer will receive an email invitation
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  description: {
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  selectedProfessional: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  fieldLabel: {
    marginBottom: 6,
    fontWeight: '500',
  },
  inputSpacing: {
    height: 16,
  },
  errorText: {
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
  },
  submitHint: {
    marginTop: 8,
    textAlign: 'center',
  },
});
