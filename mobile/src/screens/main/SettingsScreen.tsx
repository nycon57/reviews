import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  CardContent,
  Button,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';

interface SettingsItemProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingsItem({ label, value, onPress, showChevron = true }: SettingsItemProps) {
  const colors = Colors.light;

  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text variant="body">{label}</Text>
      <View style={styles.settingsItemRight}>
        {value && (
          <Text variant="muted" style={styles.settingsValue}>
            {value}
          </Text>
        )}
        {showChevron && onPress && (
          <Text style={{ color: colors.mutedForeground }}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();
  const colors = Colors.light;

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h2">Settings</Text>
        </View>

        <Text variant="small" color="muted" style={styles.sectionLabel}>
          ACCOUNT
        </Text>
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <SettingsItem
              label="Email"
              value={user?.email || '-'}
              showChevron={false}
            />
            <SettingsItem
              label="Change Password"
              onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
            />
            <SettingsItem
              label="Notification Preferences"
              onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
            />
          </CardContent>
        </Card>

        <Text variant="small" color="muted" style={styles.sectionLabel}>
          APP
        </Text>
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <SettingsItem
              label="Version"
              value={Config.appVersion}
              showChevron={false}
            />
            <SettingsItem
              label="Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
            />
            <SettingsItem
              label="Terms of Service"
              onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
            />
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          onPress={handleSignOut}
          isLoading={isLoading}
          style={styles.signOutButton}
        >
          <Text variant="body">Sign Out</Text>
        </Button>

        <Text variant="small" color="muted" style={styles.footer}>
          {Config.appName} v{Config.appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    paddingVertical: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsValue: {
    marginRight: 8,
  },
  signOutButton: {
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
  },
});
