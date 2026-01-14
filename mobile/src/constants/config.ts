import Constants from 'expo-constants';

/**
 * App configuration with environment variables
 */
export const Config = {
  // Supabase configuration
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // App configuration
  appName: 'ReviewHub',
  appVersion: Constants.expoConfig?.version || '1.0.0',

  // Feature flags
  enablePushNotifications: true,
  enableOfflineSupport: true,
};

/**
 * Validate that required configuration is present
 */
export function validateConfig(): boolean {
  const required = ['supabaseUrl', 'supabaseAnonKey'];
  const missing = required.filter(key => !Config[key as keyof typeof Config]);

  if (missing.length > 0) {
    console.warn(`Missing configuration: ${missing.join(', ')}`);
    return false;
  }

  return true;
}
