import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
  Text,
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
  getLoanOfficers,
  getUserProfile,
} from '../../lib/video-testimonials';
import type { LoanOfficer } from '../../types';

interface FormErrors {
  loanOfficer?: string;
  customerName?: string;
  customerEmail?: string;
}

export function CreateRequestScreen({ navigation }: { navigation: any }) {
  const colors = Colors.light;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [userLoanOfficerId, setUserLoanOfficerId] = useState<string | null>(null);

  // Form fields
  const [selectedLoanOfficer, setSelectedLoanOfficer] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [maxDuration, setMaxDuration] = useState<string>('120');
  const [promptText, setPromptText] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch profile and loan officers in parallel for better performance
        const [profile, officers] = await Promise.all([
          getUserProfile(),
          getLoanOfficers(),
        ]);

        setLoanOfficers(officers);

        // If user is a loan officer, pre-select themselves
        if (profile?.role === 'user') {
          // Match by user_id, not loan officer id
          const userOfficer = officers.find(lo => lo.user_id === profile.id);
          if (userOfficer) {
            setSelectedLoanOfficer(userOfficer.id);
            setUserLoanOfficerId(userOfficer.id);
          }
        } else if (officers.length === 1) {
          // Auto-select if only one option
          setSelectedLoanOfficer(officers[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedLoanOfficer) {
      newErrors.loanOfficer = 'Please select a professional';
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedLoanOfficer, customerName, customerEmail]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const result = await createVideoTestimonialRequest({
        user_id: selectedLoanOfficer,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone.trim() || undefined,
        max_duration_seconds: parseInt(maxDuration) || 120,
        prompt_text: promptText.trim() || undefined,
      });

      Alert.alert(
        'Request Sent',
        `Video testimonial request has been sent to ${customerName}. They will receive an email with instructions.`,
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
      setSubmitting(false);
    }
  }, [
    validateForm,
    selectedLoanOfficer,
    customerName,
    customerEmail,
    customerPhone,
    maxDuration,
    promptText,
    navigation,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
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
              {userLoanOfficerId ? (
                <View style={styles.selectedOfficer}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text variant="body" style={{ marginLeft: 8 }}>
                    {loanOfficers.find(lo => lo.id === userLoanOfficerId)?.full_name || 'You'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: errors.loanOfficer ? colors.destructive : colors.border }]}>
                  <Picker
                    selectedValue={selectedLoanOfficer}
                    onValueChange={(value: string) => {
                      setSelectedLoanOfficer(value);
                      if (errors.loanOfficer) {
                        setErrors(prev => ({ ...prev, loanOfficer: undefined }));
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select professional..." value="" />
                    {loanOfficers.map((lo) => (
                      <Picker.Item key={lo.id} label={lo.full_name} value={lo.id} />
                    ))}
                  </Picker>
                </View>
              )}
              {errors.loanOfficer && (
                <Text variant="small" style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.loanOfficer}
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
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  if (errors.customerName) {
                    setErrors(prev => ({ ...prev, customerName: undefined }));
                  }
                }}
                error={errors.customerName}
                autoCapitalize="words"
              />

              <View style={styles.inputSpacing} />

              <Input
                label="Email Address"
                placeholder="customer@example.com"
                value={customerEmail}
                onChangeText={(text) => {
                  setCustomerEmail(text);
                  if (errors.customerEmail) {
                    setErrors(prev => ({ ...prev, customerEmail: undefined }));
                  }
                }}
                error={errors.customerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.inputSpacing} />

              <Input
                label="Phone (Optional)"
                placeholder="(555) 123-4567"
                value={customerPhone}
                onChangeText={setCustomerPhone}
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
                  selectedValue={maxDuration}
                  onValueChange={setMaxDuration}
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
                value={promptText}
                onChangeText={setPromptText}
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
              isLoading={submitting}
              disabled={loading}
              style={styles.submitButton}
            >
              Send Request
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
  selectedOfficer: {
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
