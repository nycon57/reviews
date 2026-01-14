import type { Session, User } from '@supabase/supabase-js';

/**
 * Auth context types
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * User profile types matching web app
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'loan_officer';
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Review types
 */
export interface Review {
  id: string;
  rating: number;
  text: string;
  source: 'internal' | 'google' | 'zillow';
  status: 'pending' | 'approved' | 'rejected';
  customer_name: string;
  customer_email: string | null;
  loan_officer_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  responseRate: number;
  reviewsThisMonth: number;
  ratingTrend: 'up' | 'down' | 'stable';
}

/**
 * Navigation types
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Reviews: undefined;
  Settings: undefined;
};
