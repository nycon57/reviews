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
  role: 'admin' | 'manager' | 'user';
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
  user_id: string;
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
  Videos: undefined;
  Settings: undefined;
};

/**
 * Video testimonial types matching web app
 */
export type VideoTestimonialApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'published';

export type VideoTestimonialRequestStatus =
  | 'pending'
  | 'sent'
  | 'opened'
  | 'recording'
  | 'submitted'
  | 'expired'
  | 'cancelled';

export interface VideoTestimonialRequest {
  id: string;
  token: string;
  organization_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  max_duration_seconds: number;
  prompt_text: string | null;
  status: VideoTestimonialRequestStatus;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  expires_at: string | null;
  reminder_count: number;
  created_at: string;
  // Joined data
  user_name?: string;
}

export interface VideoTestimonialResponse {
  id: string;
  request_id: string;
  organization_id: string;
  user_id: string;
  video_url: string | null;
  video_path: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  transcription: string | null;
  transcription_status: string | null;
  ai_generated_text: string | null;
  ai_generation_status: string | null;
  key_phrases: string[] | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  approval_status: VideoTestimonialApprovalStatus;
  approved_at: string | null;
  rejection_reason: string | null;
  manager_notes: string | null;
  published_at: string | null;
  submitted_at: string;
  created_at: string;
  // Joined data
  customer_name: string;
  customer_email: string;
  user_name: string;
}

export interface VideoTestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  averageDuration: number;
}

export interface Professional {
  id: string;
  full_name: string;
  email: string;
  user_id?: string | null;
}

/** @deprecated Use Professional instead */
export type LoanOfficer = Professional;

export interface CreateVideoRequestInput {
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  max_duration_seconds?: number;
  prompt_text?: string;
}

/**
 * Video screens navigation types
 */
export type VideoStackParamList = {
  VideoList: undefined;
  VideoDetail: { videoId: string };
  CreateRequest: undefined;
};
