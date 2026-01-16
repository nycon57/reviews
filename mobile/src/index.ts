/**
 * RepWell Mobile App
 *
 * Entry point for all shared exports from the mobile app.
 */

// Components
export * from './components/ui';

// Navigation
export * from './navigation';

// Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Lib
export { supabase, isSupabaseConfigured } from './lib/supabase';

// Constants
export { Colors, type ColorScheme } from './constants/colors';
export { Config, validateConfig } from './constants/config';

// Types
export * from './types';
