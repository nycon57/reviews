import { z } from "zod";

// Badge Categories
export type BadgeCategory =
  | "teamwork"
  | "innovation"
  | "leadership"
  | "customer_focus"
  | "excellence"
  | "growth"
  | "mentorship"
  | "positivity"
  | "reliability"
  | "custom";

// Recognition Badge Type
export interface RecognitionBadge {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  icon: string;
  category: BadgeCategory;
  points: number;
  color?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Recognition Visibility
export type RecognitionVisibility = "public" | "team" | "private";

// Employee Recognition (Kudos)
export interface Recognition {
  id: string;
  organizationId: string;
  fromUserId: string;
  toUserId: string;
  badgeId?: string;
  message: string;
  visibility: RecognitionVisibility;
  isAnonymous: boolean;
  pointsAwarded: number;
  createdAt: string;
  // Joined data
  fromUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
    departmentName?: string;
  };
  toUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
    departmentName?: string;
  };
  badge?: RecognitionBadge;
  reactions?: RecognitionReaction[];
  reactionCount?: number;
  userReaction?: string;
}

// Recognition Reaction
export interface RecognitionReaction {
  id: string;
  recognitionId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// Manager Feedback Types
export type FeedbackType = "praise" | "constructive" | "goal_progress" | "check_in" | "performance";

// Manager Feedback
export interface ManagerFeedback {
  id: string;
  organizationId: string;
  fromUserId: string;
  toUserId: string;
  type: FeedbackType;
  subject: string;
  content: string;
  isPrivate: boolean;
  linkedGoalId?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  fromUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  toUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    departmentName?: string;
  };
}

// Recognition Summary (for monthly/quarterly reports)
export interface RecognitionSummary {
  id: string;
  organizationId: string;
  userId: string;
  departmentId?: string;
  periodType: "weekly" | "monthly" | "quarterly" | "yearly";
  periodStart: string;
  periodEnd: string;
  recognitionsGiven: number;
  recognitionsReceived: number;
  pointsGiven: number;
  pointsReceived: number;
  topBadgeId?: string;
  badgesBreakdown?: Record<string, number>;
  createdAt: string;
  // Joined data
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
    departmentName?: string;
  };
  topBadge?: RecognitionBadge;
}

// Recognition Analytics (computed aggregates)
export interface RecognitionAnalytics {
  totalRecognitions: number;
  totalPoints: number;
  uniqueGivers: number;
  uniqueRecipients: number;
  participationRate: number;
  topGivers: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
    count: number;
  }>;
  topRecipients: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
    count: number;
    points: number;
  }>;
  topBadges: Array<{
    badgeId: string;
    name: string;
    icon: string;
    color?: string;
    count: number;
  }>;
  byDepartment?: Record<string, { count: number; points: number }>;
}

// Zod Schemas for validation
export const badgeCategorySchema = z.enum([
  "teamwork",
  "innovation",
  "leadership",
  "customer_focus",
  "excellence",
  "growth",
  "mentorship",
  "positivity",
  "reliability",
  "custom",
]);

export const recognitionVisibilitySchema = z.enum(["public", "team", "private"]);

export const feedbackTypeSchema = z.enum(["praise", "constructive", "goal_progress", "check_in", "performance"]);

export const createRecognitionBadgeSchema = z.object({
  name: z.string().min(1, "Badge name is required").max(50),
  description: z.string().max(200).optional(),
  icon: z.string().min(1, "Icon is required"),
  category: badgeCategorySchema,
  points: z.number().min(1).max(100).default(10),
  color: z.string().optional(),
});

export const updateRecognitionBadgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  category: badgeCategorySchema.optional(),
  points: z.number().min(1).max(100).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createRecognitionSchema = z.object({
  toUserId: z.string().uuid("Invalid recipient"),
  badgeId: z.string().uuid().optional(),
  message: z.string().min(5, "Message must be at least 5 characters").max(500, "Message must be less than 500 characters"),
  visibility: recognitionVisibilitySchema.default("public"),
  isAnonymous: z.boolean().default(false),
});

export const createFeedbackSchema = z.object({
  toUserId: z.string().uuid("Invalid recipient"),
  type: feedbackTypeSchema,
  subject: z.string().min(1, "Subject is required").max(200),
  content: z.string().min(10, "Content must be at least 10 characters").max(2000),
  isPrivate: z.boolean().default(true),
  linkedGoalId: z.string().uuid().optional(),
});

export const updateFeedbackSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(2000).optional(),
  isPrivate: z.boolean().optional(),
});

// Input types derived from schemas
export type CreateRecognitionBadgeInput = z.infer<typeof createRecognitionBadgeSchema>;
export type UpdateRecognitionBadgeInput = z.infer<typeof updateRecognitionBadgeSchema>;
export type CreateRecognitionInput = z.infer<typeof createRecognitionSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;

// Feedback type labels and colors
export const FEEDBACK_TYPE_CONFIG: Record<FeedbackType, { label: string; color: string; bgColor: string; icon: string }> = {
  praise: { label: "Praise", color: "text-green-600", bgColor: "bg-green-50", icon: "Star" },
  constructive: { label: "Constructive", color: "text-amber-600", bgColor: "bg-amber-50", icon: "MessageSquare" },
  goal_progress: { label: "Goal Progress", color: "text-purple-600", bgColor: "bg-purple-50", icon: "TrendingUp" },
  check_in: { label: "Check-in", color: "text-blue-600", bgColor: "bg-blue-50", icon: "ClipboardList" },
  performance: { label: "Performance Note", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: "FileText" },
};

// Default reaction emojis
export const REACTION_EMOJIS = ["👍", "🎉", "💪", "❤️", "💡", "🙌", "👏", "🔥"];

// Helper functions
export function formatRecognitionDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

export function calculateParticipationRate(uniqueParticipants: number, totalEmployees: number): number {
  if (totalEmployees === 0) return 0;
  return Math.round((uniqueParticipants / totalEmployees) * 100);
}

// Period options for analytics
export type AnalyticsPeriod = "week" | "month" | "quarter" | "year" | "all";

export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

// Default badges
export const DEFAULT_BADGES: Omit<RecognitionBadge, "id" | "organizationId" | "createdAt" | "updatedAt">[] = [
  {
    name: "Team Player",
    description: "Outstanding collaboration and teamwork",
    icon: "Users",
    category: "teamwork",
    points: 10,
    color: "#3B82F6",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Innovator",
    description: "Creative thinking and problem solving",
    icon: "Lightbulb",
    category: "innovation",
    points: 15,
    color: "#F59E0B",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Go-Getter",
    description: "Exceptional drive and initiative",
    icon: "Rocket",
    category: "excellence",
    points: 15,
    color: "#10B981",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Mentor",
    description: "Helping others grow and develop",
    icon: "GraduationCap",
    category: "mentorship",
    points: 20,
    color: "#8B5CF6",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Customer Champion",
    description: "Going above and beyond for customers",
    icon: "Heart",
    category: "customer_focus",
    points: 15,
    color: "#EC4899",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Rising Star",
    description: "Exceptional growth and learning",
    icon: "Star",
    category: "growth",
    points: 10,
    color: "#F97316",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Positive Vibes",
    description: "Bringing energy and positivity to the team",
    icon: "Smile",
    category: "positivity",
    points: 10,
    color: "#14B8A6",
    isActive: true,
    isDefault: true,
  },
  {
    name: "Rock Solid",
    description: "Consistently reliable and dependable",
    icon: "Shield",
    category: "reliability",
    points: 15,
    color: "#6366F1",
    isActive: true,
    isDefault: true,
  },
];
