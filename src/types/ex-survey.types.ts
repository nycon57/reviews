import { z } from "zod";
import { questionSchema, surveyBrandingSchema, thankYouConfigSchema } from "./survey.types";

// EX Question type (uses 'text' instead of 'title' for compatibility)
export interface EXQuestion {
  id: string;
  type: "rating" | "nps" | "text" | "single_choice" | "multiple_choice";
  text: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  scale?: {
    min?: number;
    max?: number;
    labels?: string[];
  };
}

// EX Survey Types
export type EXSurveyType = "engagement" | "pulse" | "exit" | "onboarding" | "custom";
export type EXSurveyFrequency = "once" | "weekly" | "monthly" | "quarterly" | "annual";
export type EXSurveyStatus = "draft" | "scheduled" | "active" | "closed" | "archived";
export type TenureRange = "0-6months" | "6-12months" | "1-2years" | "2-5years" | "5-10years" | "10+years";

/** @deprecated Use contacts.department (free-text) instead. See getContactDepartments() in @/lib/contacts/actions. */
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  managerUserId?: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// EX Survey Template
export interface EXSurveyTemplate {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  surveyType: EXSurveyType;
  frequency?: EXSurveyFrequency;
  isAnonymous: boolean;
  isDefault: boolean;
  isActive: boolean;
  questions: EXQuestion[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    showProgressBar?: boolean;
    showQuestionNumbers?: boolean;
  };
  thankYouConfig?: {
    title: string;
    message: string;
    showSocialShare?: boolean;
    redirectUrl?: string;
    redirectDelay?: number;
  };
  targetDepartments?: string[];
  targetRoles?: string[];
  notificationSettings?: {
    sendReminders?: boolean;
    reminderDays?: number[];
    notifyManagers?: boolean;
  };
  benchmarkCategory?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  estimatedTimeMinutes?: number;
}

// EX Survey Campaign
export interface EXSurvey {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  description?: string;
  surveyType: EXSurveyType;
  isAnonymous: boolean;
  status: EXSurveyStatus;
  targetDepartments?: string[];
  targetRoles?: string[];
  startDate?: string;
  endDate?: string;
  reminderSchedule?: {
    days: number[];
    sentAt?: string[];
  };
  totalInvites: number;
  totalResponses: number;
  responseRate: number;
  enpsScore?: number;
  averageRating?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// EX Survey Invitation
export interface EXSurveyInvitation {
  id: string;
  surveyId: string;
  userId: string;
  departmentId?: string;
  token: string;
  status: "pending" | "sent" | "opened" | "completed" | "expired";
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  reminderCount: number;
  lastReminderAt?: string;
  createdAt: string;
}

// EX Survey Response
export interface EXSurveyResponse {
  id: string;
  surveyId: string;
  invitationId?: string;
  departmentId?: string;
  tenureRange?: TenureRange;
  roleCategory?: string;
  isAnonymous: boolean;
  answers: Record<string, unknown>[];
  enpsScore?: number;
  overallRating?: number;
  sentimentScore?: number;
  sentimentLabel?: string;
  themes?: string[];
  keyPhrases?: string[];
  aiSummary?: string;
  submittedAt: string;
  createdAt: string;
}

// EX Survey Answer (extends base answer for EX-specific fields)
export interface EXSurveyAnswer {
  questionId: string;
  questionType: string;
  value: string | number | string[];
  category?: string;
}

// EX Metrics Snapshot
export interface EXMetricsSnapshot {
  id: string;
  organizationId: string;
  departmentId?: string;
  surveyId?: string;
  periodType: "survey" | "weekly" | "monthly" | "quarterly" | "yearly";
  periodStart: string;
  periodEnd: string;
  metrics: {
    enpsScore?: number;
    engagementScore?: number;
    responseRate?: number;
    totalResponses?: number;
    themes?: Record<string, number>;
    byDepartment?: Record<string, {
      enpsScore?: number;
      engagementScore?: number;
      responseRate?: number;
      totalResponses?: number;
    }>;
    byTenure?: Record<string, {
      enpsScore?: number;
      engagementScore?: number;
      totalResponses?: number;
    }>;
  };
  enpsScore?: number;
  engagementScore?: number;
  responseRate?: number;
  totalResponses: number;
  benchmarkComparison?: {
    category: string;
    enpsScore?: number;
    engagementScore?: number;
    percentile?: number;
  };
  computedAt: string;
}

// EX Benchmark
export interface EXBenchmark {
  id: string;
  category: string;
  year: number;
  quarter?: number;
  metrics: {
    enpsAvg?: number;
    engagementAvg?: number;
    responseRateAvg?: number;
    byCompanySize?: Record<string, {
      enpsAvg?: number;
      engagementAvg?: number;
    }>;
  };
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// Zod Schemas for validation
export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional().nullable(),
  managerUserId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const exSurveyTypeSchema = z.enum(["engagement", "pulse", "exit", "onboarding", "custom"]);
export const exSurveyFrequencySchema = z.enum(["once", "weekly", "monthly", "quarterly", "annual"]);
export const exSurveyStatusSchema = z.enum(["draft", "scheduled", "active", "closed", "archived"]);
export const tenureRangeSchema = z.enum(["0-6months", "6-12months", "1-2years", "2-5years", "5-10years", "10+years"]);

export const notificationSettingsSchema = z.object({
  sendReminders: z.boolean().optional(),
  reminderDays: z.array(z.number()).optional(),
  notifyManagers: z.boolean().optional(),
});

// EX Question schema (uses 'text' field instead of 'title')
export const exQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["rating", "nps", "text", "single_choice", "multiple_choice"]),
  text: z.string().min(1, "Question text is required"),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  options: z.array(z.string()).optional(),
  scale: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    labels: z.array(z.string()).optional(),
  }).optional(),
});

export const createEXSurveyTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(500).optional(),
  surveyType: exSurveyTypeSchema,
  frequency: exSurveyFrequencySchema.optional(),
  isAnonymous: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  questions: z.array(exQuestionSchema).min(1, "At least one question is required"),
  branding: surveyBrandingSchema.optional(),
  thankYouConfig: thankYouConfigSchema.optional(),
  targetDepartments: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  benchmarkCategory: z.string().optional(),
});

export const updateEXSurveyTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Template name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  surveyType: exSurveyTypeSchema.optional(),
  frequency: exSurveyFrequencySchema.optional(),
  isAnonymous: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  questions: z.array(questionSchema).min(1).optional(),
  branding: surveyBrandingSchema.optional(),
  thankYouConfig: thankYouConfigSchema.optional(),
  targetDepartments: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  benchmarkCategory: z.string().optional(),
});

export const createEXSurveySchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1, "Survey name is required").max(100),
  description: z.string().max(500).optional(),
  surveyType: exSurveyTypeSchema,
  isAnonymous: z.boolean().optional().default(true),
  targetDepartments: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reminderSchedule: z.object({
    days: z.array(z.number()),
  }).optional(),
});

// Input types derived from schemas
export type CreateDepartmentInput = z.infer<typeof departmentSchema>;
export type CreateEXSurveyTemplateInput = z.infer<typeof createEXSurveyTemplateSchema>;
export type UpdateEXSurveyTemplateInput = z.infer<typeof updateEXSurveyTemplateSchema>;
export type CreateEXSurveyInput = z.infer<typeof createEXSurveySchema>;

// Default EX Survey Templates
type DefaultEXTemplateData = Omit<EXSurveyTemplate, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy" | "estimatedTimeMinutes">;

export const DEFAULT_EX_TEMPLATES: Record<string, DefaultEXTemplateData> = {
  ENGAGEMENT: {
    name: "Employee Engagement Survey",
    description: "Comprehensive survey to measure employee engagement and satisfaction",
    surveyType: "engagement",
    frequency: "quarterly",
    isAnonymous: true,
    isActive: true,
    isDefault: true,
    questions: [
      {
        id: "ex-enps",
        type: "nps",
        text: "How likely are you to recommend this company as a great place to work?",
        description: "On a scale of 0-10, where 0 is not at all likely and 10 is extremely likely",
        required: true,
        order: 0,
      },
      {
        id: "ex-overall",
        type: "rating",
        text: "Overall, how satisfied are you with your job?",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"] },
      },
      {
        id: "ex-growth",
        type: "rating",
        text: "I have opportunities to learn and grow in my role",
        required: true,
        order: 2,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ex-recognition",
        type: "rating",
        text: "I feel recognized for my contributions",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ex-manager",
        type: "rating",
        text: "My manager supports my development and success",
        required: true,
        order: 4,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ex-worklife",
        type: "rating",
        text: "I have a good work-life balance",
        required: true,
        order: 5,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ex-improvements",
        type: "multiple_choice",
        text: "Which areas would you like to see improved?",
        description: "Select all that apply",
        required: false,
        order: 6,
        options: ["Communication", "Career development", "Compensation & benefits", "Tools & resources", "Company culture", "Remote/flexible work options"],
      },
      {
        id: "ex-feedback",
        type: "text",
        text: "What would make this a better place to work?",
        description: "Your feedback is anonymous and helps us improve",
        required: false,
        order: 7,
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "Your responses help us create a better workplace for everyone. Results will be shared with leadership to drive meaningful improvements.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [3, 7],
      notifyManagers: false,
    },
    benchmarkCategory: "general",
  },
  PULSE: {
    name: "Quick Pulse Survey",
    description: "Short, frequent check-in on employee sentiment",
    surveyType: "pulse",
    frequency: "monthly",
    isAnonymous: true,
    isActive: true,
    isDefault: false,
    questions: [
      {
        id: "pulse-mood",
        type: "rating",
        text: "How are you feeling about work this week?",
        required: true,
        order: 0,
        scale: { min: 1, max: 5, labels: ["Very negative", "Negative", "Neutral", "Positive", "Very positive"] },
      },
      {
        id: "pulse-workload",
        type: "rating",
        text: "My workload is manageable",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "pulse-comment",
        type: "text",
        text: "Anything you'd like to share?",
        required: false,
        order: 2,
      },
    ],
    branding: {
      showProgressBar: false,
      showQuestionNumbers: false,
    },
    thankYouConfig: {
      title: "Thanks!",
      message: "Your pulse check helps us stay in tune with the team.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [2],
      notifyManagers: false,
    },
  },
  EXIT: {
    name: "Exit Interview Survey",
    description: "Gather feedback from departing employees",
    surveyType: "exit",
    frequency: "once",
    isAnonymous: false,
    isActive: true,
    isDefault: false,
    questions: [
      {
        id: "exit-reason",
        type: "single_choice",
        text: "What is your primary reason for leaving?",
        required: true,
        order: 0,
        options: ["Career advancement", "Compensation", "Company culture", "Manager relationship", "Work-life balance", "Relocation", "Personal reasons", "Other"],
      },
      {
        id: "exit-overall",
        type: "rating",
        text: "How would you rate your overall experience at this company?",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Very poor", "Poor", "Neutral", "Good", "Excellent"] },
      },
      {
        id: "exit-recommend",
        type: "nps",
        text: "How likely would you be to recommend this company to others?",
        required: true,
        order: 2,
      },
      {
        id: "exit-manager-rating",
        type: "rating",
        text: "How would you rate your relationship with your direct manager?",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Very poor", "Poor", "Neutral", "Good", "Excellent"] },
      },
      {
        id: "exit-what-worked",
        type: "text",
        text: "What did you enjoy most about working here?",
        required: false,
        order: 4,
      },
      {
        id: "exit-improvements",
        type: "text",
        text: "What could the company improve?",
        required: false,
        order: 5,
      },
      {
        id: "exit-return",
        type: "single_choice",
        text: "Would you consider returning to this company in the future?",
        required: true,
        order: 6,
        options: ["Yes, definitely", "Maybe, under the right circumstances", "No"],
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your time",
      message: "We appreciate your candid feedback and wish you the best in your future endeavors.",
    },
    notificationSettings: {
      sendReminders: false,
      notifyManagers: false,
    },
  },
  ONBOARDING: {
    name: "Onboarding Experience Survey",
    description: "Collect feedback from new hires about their onboarding experience",
    surveyType: "onboarding",
    frequency: "once",
    isAnonymous: false,
    isActive: true,
    isDefault: false,
    questions: [
      {
        id: "onboard-prepared",
        type: "rating",
        text: "I felt well-prepared for my role after completing onboarding",
        required: true,
        order: 0,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "onboard-welcome",
        type: "rating",
        text: "I felt welcomed by my team",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "onboard-manager",
        type: "rating",
        text: "My manager was available to answer my questions",
        required: true,
        order: 2,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "onboard-tools",
        type: "rating",
        text: "I had the tools and resources I needed to get started",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "onboard-expectations",
        type: "rating",
        text: "The job has met my expectations so far",
        required: true,
        order: 4,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "onboard-feedback",
        type: "text",
        text: "What could we do to improve the onboarding experience?",
        required: false,
        order: 5,
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "Your input helps us create a better experience for future new hires.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [3],
      notifyManagers: false,
    },
  },
  IC_CONTRIBUTOR: {
    name: "Individual Contributor Engagement",
    description: "Focused survey for individual contributors measuring tools, clarity, growth, and voice",
    surveyType: "engagement",
    frequency: "quarterly",
    isAnonymous: true,
    isActive: true,
    isDefault: true,
    targetRoles: ["user"],
    questions: [
      {
        id: "ic-enps",
        type: "nps",
        text: "How likely are you to recommend this company as a great place to work?",
        description: "On a scale of 0-10, where 0 is not at all likely and 10 is extremely likely",
        required: true,
        order: 0,
      },
      {
        id: "ic-tools",
        type: "rating",
        text: "I have the tools and resources I need to do my job effectively",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ic-clarity",
        type: "rating",
        text: "I have a clear understanding of my role and responsibilities",
        required: true,
        order: 2,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ic-growth",
        type: "rating",
        text: "I have opportunities to grow and develop in my role",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ic-voice",
        type: "rating",
        text: "My ideas and opinions are valued and heard",
        required: true,
        order: 4,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "ic-blockers",
        type: "multiple_choice",
        text: "What most often prevents you from doing your best work?",
        description: "Select all that apply",
        required: false,
        order: 5,
        options: ["Unclear priorities", "Inadequate tools/software", "Too many meetings", "Lack of context", "Process friction", "Insufficient training"],
      },
      {
        id: "ic-feedback",
        type: "text",
        text: "What one change would make you more effective in your role?",
        description: "Your feedback is anonymous",
        required: false,
        order: 6,
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "Your input helps us create better working conditions for everyone.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [3, 7],
      notifyManagers: false,
    },
    benchmarkCategory: "general",
  },
  MANAGER_EXPERIENCE: {
    name: "Manager & Team Lead Survey",
    description: "Survey for managers and team leads measuring leadership support, authority, and team health",
    surveyType: "engagement",
    frequency: "quarterly",
    isAnonymous: true,
    isActive: true,
    isDefault: true,
    targetRoles: ["manager", "admin"],
    questions: [
      {
        id: "mgr-enps",
        type: "nps",
        text: "How likely are you to recommend this company as a great place to lead a team?",
        description: "On a scale of 0-10, where 0 is not at all likely and 10 is extremely likely",
        required: true,
        order: 0,
      },
      {
        id: "mgr-support",
        type: "rating",
        text: "I receive adequate support from my leadership to manage my team effectively",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "mgr-authority",
        type: "rating",
        text: "I have the authority to make decisions that affect my team",
        required: true,
        order: 2,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "mgr-workload",
        type: "rating",
        text: "My workload as a manager is sustainable",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "mgr-team-perf",
        type: "rating",
        text: "I have the resources and support needed to help my team perform at their best",
        required: true,
        order: 4,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "mgr-challenges",
        type: "multiple_choice",
        text: "What are your biggest challenges as a manager?",
        description: "Select all that apply",
        required: false,
        order: 5,
        options: ["Hiring/recruiting", "Performance management", "Cross-team coordination", "Budget constraints", "Retaining talent", "Communication from leadership"],
      },
      {
        id: "mgr-support-need",
        type: "single_choice",
        text: "What type of support would help you most?",
        required: false,
        order: 6,
        options: ["Management training", "Mentorship/coaching", "Better tools/systems", "More headcount", "Clearer expectations"],
      },
      {
        id: "mgr-feedback",
        type: "text",
        text: "What would make you more effective as a manager here?",
        description: "Your feedback is anonymous",
        required: false,
        order: 7,
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "Your leadership insights help us improve the manager experience across the organization.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [3, 7],
      notifyManagers: false,
    },
    benchmarkCategory: "managers",
  },
  ALL_EMPLOYEES: {
    name: "Company-Wide Culture Survey",
    description: "Universal survey for all employees measuring culture, belonging, values, and communication",
    surveyType: "engagement",
    frequency: "quarterly",
    isAnonymous: true,
    isActive: true,
    isDefault: true,
    targetRoles: [],
    questions: [
      {
        id: "all-enps",
        type: "nps",
        text: "How likely are you to recommend this company as a great place to work?",
        description: "On a scale of 0-10, where 0 is not at all likely and 10 is extremely likely",
        required: true,
        order: 0,
      },
      {
        id: "all-belonging",
        type: "rating",
        text: "I feel a sense of belonging at this company",
        required: true,
        order: 1,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "all-communication",
        type: "rating",
        text: "Leadership communicates a clear vision and direction",
        required: true,
        order: 2,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "all-values",
        type: "rating",
        text: "The company lives by its stated values",
        required: true,
        order: 3,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "all-pride",
        type: "rating",
        text: "I am proud to work for this company",
        required: true,
        order: 4,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "all-wellbeing",
        type: "rating",
        text: "The company cares about my wellbeing",
        required: true,
        order: 5,
        scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
      },
      {
        id: "all-focus",
        type: "single_choice",
        text: "What should leadership focus on most in the next quarter?",
        required: false,
        order: 6,
        options: ["Employee growth & development", "Work-life balance", "Compensation & benefits", "Communication & transparency", "Innovation & strategy"],
      },
      {
        id: "all-feedback",
        type: "text",
        text: "If you could change one thing about working here, what would it be?",
        description: "Your feedback is anonymous",
        required: false,
        order: 7,
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "Your voice matters. Results will be shared to drive meaningful change.",
    },
    notificationSettings: {
      sendReminders: true,
      reminderDays: [3, 7],
      notifyManagers: false,
    },
    benchmarkCategory: "general",
  },
};

// Helper function to calculate eNPS from responses
export function calculateENPS(scores: number[]): number {
  if (scores.length === 0) return 0;

  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;

  return Math.round(((promoters - detractors) / scores.length) * 100);
}

// Helper function to get eNPS category
export function getENPSCategory(score: number): "detractor" | "passive" | "promoter" {
  if (score <= 6) return "detractor";
  if (score <= 8) return "passive";
  return "promoter";
}

// Helper function to interpret eNPS score
export function interpretENPS(score: number): { label: string; color: string; description: string } {
  if (score >= 50) {
    return {
      label: "Excellent",
      color: "text-green-600",
      description: "Your employees are highly engaged and likely to recommend the company",
    };
  }
  if (score >= 20) {
    return {
      label: "Good",
      color: "text-blue-600",
      description: "Your employees are generally satisfied with more promoters than detractors",
    };
  }
  if (score >= 0) {
    return {
      label: "Neutral",
      color: "text-yellow-600",
      description: "Your employees are roughly split between promoters and detractors",
    };
  }
  return {
    label: "Needs Improvement",
    color: "text-red-600",
    description: "More employees are detractors than promoters - action is recommended",
  };
}

// Helper function to calculate engagement score from ratings
export function calculateEngagementScore(ratings: number[], maxRating: number = 5): number {
  if (ratings.length === 0) return 0;
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return Math.round((average / maxRating) * 100);
}
