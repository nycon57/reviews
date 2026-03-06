/**
 * Profile Completion Gamification Types
 * Points-based system for profile completion that incentivizes loan officers
 * to complete their profiles with all recommended information.
 */

// Profile completion field categories
export type ProfileSection =
  | "basic_info"
  | "professional_details"
  | "external_connections"
  | "social_presence";

// Individual profile field definition
export interface ProfileCompletionField {
  id: string;
  label: string;
  description: string;
  section: ProfileSection;
  points: number;
  isRequired: boolean;
  tip: string;
  linkUrl?: string;
  linkLabel?: string;
}

// Section configuration with metadata
export interface ProfileSectionConfig {
  id: ProfileSection;
  name: string;
  description: string;
  icon: string;
  maxPoints: number;
  fields: ProfileCompletionField[];
}

// Individual field completion status
export interface FieldCompletionStatus {
  field: ProfileCompletionField;
  completed: boolean;
  earnedPoints: number;
}

// Section completion status
export interface SectionCompletionStatus {
  section: ProfileSectionConfig;
  completed: boolean;
  completedFields: number;
  totalFields: number;
  earnedPoints: number;
  maxPoints: number;
  percentage: number;
  fields: FieldCompletionStatus[];
}

// Overall profile completion data
export interface ProfileCompletionScore {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  searchRankScore: number; // 0-850 score similar to experience.com
  rank: number | null;
  sections: SectionCompletionStatus[];
  nextActions: ProfileCompletionTip[];
  milestones: ProfileMilestone[];
}

// Tips and recommendations
export interface ProfileCompletionTip {
  field: ProfileCompletionField;
  priority: "high" | "medium" | "low";
  impact: number; // Points gained if completed
}

// Profile completion milestones
export interface ProfileMilestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number; // Percentage required
  achieved: boolean;
  achievedAt?: Date;
  bonusPoints: number;
}

// Leaderboard entry for profile completion
export interface ProfileCompletionLeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  photoUrl: string | null;
  branch: string | null;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  searchRankScore: number;
  completedSections: number;
  totalSections: number;
}

// Configuration: Profile completion fields with points
export const PROFILE_COMPLETION_FIELDS: ProfileCompletionField[] = [
  // Basic Info Section (150 points total)
  {
    id: "photo_url",
    label: "Profile Photo",
    description: "A professional headshot builds trust with clients",
    section: "basic_info",
    points: 50,
    isRequired: false,
    tip: "Upload a professional headshot with good lighting and a neutral background",
    linkUrl: "/dashboard/profile",
    linkLabel: "Upload Photo",
  },
  {
    id: "full_name",
    label: "Full Name",
    description: "Your name as it appears on professional documents",
    section: "basic_info",
    points: 25,
    isRequired: true,
    tip: "Use your full professional name",
  },
  {
    id: "email",
    label: "Email Address",
    description: "Primary contact email for clients",
    section: "basic_info",
    points: 25,
    isRequired: true,
    tip: "Use a professional business email",
  },
  {
    id: "phone",
    label: "Phone Number",
    description: "Direct line for client communications",
    section: "basic_info",
    points: 25,
    isRequired: false,
    tip: "Add a direct phone number where clients can reach you",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add Phone",
  },
  {
    id: "title",
    label: "Job Title",
    description: "Your professional title (e.g., Senior Loan Officer)",
    section: "basic_info",
    points: 25,
    isRequired: false,
    tip: "Include your official job title to establish credibility",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add Title",
  },

  // Professional Details Section (200 points total)
  {
    id: "bio",
    label: "Professional Bio",
    description: "Tell clients about your experience and expertise",
    section: "professional_details",
    points: 75,
    isRequired: false,
    tip: "Write 2-3 paragraphs about your experience, specializations, and what makes you unique",
    linkUrl: "/dashboard/profile",
    linkLabel: "Write Bio",
  },
  {
    id: "nmls_id",
    label: "NMLS ID",
    description: "Your unique NMLS identifier number",
    section: "professional_details",
    points: 50,
    isRequired: false,
    tip: "Add your NMLS ID for compliance and to help clients verify your credentials",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add NMLS ID",
  },
  {
    id: "branch",
    label: "Branch Location",
    description: "Your primary branch or office location",
    section: "professional_details",
    points: 25,
    isRequired: false,
    tip: "Associate yourself with your branch for better team coordination",
    linkUrl: "/dashboard/profile",
    linkLabel: "Set Branch",
  },
  {
    id: "address",
    label: "Office Address",
    description: "Your primary office location",
    section: "professional_details",
    points: 25,
    isRequired: false,
    tip: "Add your office address for clients who prefer in-person meetings",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add Address",
  },

  // External Connections Section (300 points total)
  {
    id: "google_place_id",
    label: "Google Business Profile",
    description: "Connect your Google Business Profile for reviews",
    section: "external_connections",
    points: 100,
    isRequired: false,
    tip: "Link your Google Business Profile to automatically sync reviews and boost visibility",
    linkUrl: "/dashboard/integrations/google",
    linkLabel: "Connect Google",
  },
  {
    id: "zillow_profile_url",
    label: "Zillow Profile",
    description: "Link to your Zillow lending profile",
    section: "external_connections",
    points: 100,
    isRequired: false,
    tip: "Add your Zillow profile URL to aggregate reviews from multiple platforms",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add Zillow URL",
  },
  {
    id: "linkedin_url",
    label: "LinkedIn Profile",
    description: "Your professional LinkedIn profile",
    section: "external_connections",
    points: 50,
    isRequired: false,
    tip: "Connect your LinkedIn to build professional credibility",
    linkUrl: "/dashboard/profile",
    linkLabel: "Add LinkedIn",
  },
  {
    id: "has_social_connection",
    label: "Social Media Connection",
    description: "Connect a social media account for auto-publishing",
    section: "external_connections",
    points: 50,
    isRequired: false,
    tip: "Connect Facebook, Twitter, or Instagram to automatically share testimonials",
    linkUrl: "/dashboard/social",
    linkLabel: "Connect Social",
  },

  // Social Presence Section (200 points total)
  {
    id: "has_reviews",
    label: "Collected Reviews",
    description: "Have at least 5 reviews on your profile",
    section: "social_presence",
    points: 75,
    isRequired: false,
    tip: "Request reviews from satisfied clients to build social proof",
    linkUrl: "/dashboard/distribution",
    linkLabel: "Request Reviews",
  },
  {
    id: "has_testimonials",
    label: "Published Testimonials",
    description: "Have approved testimonials for marketing",
    section: "social_presence",
    points: 50,
    isRequired: false,
    tip: "Convert your best reviews into testimonials for marketing materials",
    linkUrl: "/dashboard/share-studio",
    linkLabel: "View Share Studio",
  },
  {
    id: "has_published_posts",
    label: "Social Media Posts",
    description: "Published at least one testimonial to social media",
    section: "social_presence",
    points: 50,
    isRequired: false,
    tip: "Share your testimonials on social media to expand your reach",
    linkUrl: "/dashboard/social",
    linkLabel: "Share Testimonials",
  },
  {
    id: "response_rate_50",
    label: "Survey Response Rate",
    description: "Achieve 50%+ survey response rate",
    section: "social_presence",
    points: 25,
    isRequired: false,
    tip: "Follow up with clients to encourage survey completion",
    linkUrl: "/dashboard/distribution",
    linkLabel: "Send Surveys",
  },
];

// Section configurations
export const PROFILE_SECTIONS: ProfileSectionConfig[] = [
  {
    id: "basic_info",
    name: "Basic Information",
    description: "Essential contact and identity information",
    icon: "User",
    maxPoints: 150,
    fields: PROFILE_COMPLETION_FIELDS.filter((f) => f.section === "basic_info"),
  },
  {
    id: "professional_details",
    name: "Professional Details",
    description: "Credentials and professional background",
    icon: "Briefcase",
    maxPoints: 200,
    fields: PROFILE_COMPLETION_FIELDS.filter((f) => f.section === "professional_details"),
  },
  {
    id: "external_connections",
    name: "External Connections",
    description: "Third-party platform integrations",
    icon: "Link",
    maxPoints: 300,
    fields: PROFILE_COMPLETION_FIELDS.filter((f) => f.section === "external_connections"),
  },
  {
    id: "social_presence",
    name: "Social Presence",
    description: "Reviews, testimonials, and social activity",
    icon: "Share2",
    maxPoints: 200,
    fields: PROFILE_COMPLETION_FIELDS.filter((f) => f.section === "social_presence"),
  },
];

// Profile completion milestones
export const PROFILE_MILESTONES: Omit<ProfileMilestone, "achieved" | "achievedAt">[] = [
  {
    id: "profile_started",
    name: "Getting Started",
    description: "Complete 25% of your profile",
    icon: "Sparkles",
    threshold: 25,
    bonusPoints: 10,
  },
  {
    id: "profile_halfway",
    name: "Halfway There",
    description: "Complete 50% of your profile",
    icon: "Trophy",
    threshold: 50,
    bonusPoints: 25,
  },
  {
    id: "profile_almost",
    name: "Almost Complete",
    description: "Complete 75% of your profile",
    icon: "Medal",
    threshold: 75,
    bonusPoints: 50,
  },
  {
    id: "profile_complete",
    name: "Profile Pro",
    description: "Complete 100% of your profile",
    icon: "Crown",
    threshold: 100,
    bonusPoints: 100,
  },
  {
    id: "external_connected",
    name: "Connected",
    description: "Connect all external platforms",
    icon: "Link2",
    threshold: -1, // Special milestone
    bonusPoints: 75,
  },
];

// Maximum possible points
export const MAX_PROFILE_POINTS = PROFILE_COMPLETION_FIELDS.reduce(
  (sum, field) => sum + field.points,
  0
);

// Maximum milestone bonus points
export const MAX_MILESTONE_BONUS = PROFILE_MILESTONES.reduce(
  (sum, m) => sum + m.bonusPoints,
  0
);

// Search Rank Score calculation constants (similar to experience.com 850 max)
export const SEARCH_RANK_MAX = 850;
export const SEARCH_RANK_WEIGHTS = {
  profileCompletion: 0.25, // 25% of score from profile completion
  reviewCount: 0.25, // 25% from review count
  averageRating: 0.25, // 25% from average rating
  engagementScore: 0.25, // 25% from engagement (response rate, social posts, etc.)
};
