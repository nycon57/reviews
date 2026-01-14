import { z } from "zod";

// Survey Question Types
export type QuestionType = "rating" | "nps" | "text" | "multiple_choice";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
}

export interface RatingQuestion extends BaseQuestion {
  type: "rating";
  config: {
    maxRating: number; // 5 or 10
    labels?: {
      low?: string;
      high?: string;
    };
  };
}

export interface NPSQuestion extends BaseQuestion {
  type: "nps";
  config: {
    labels?: {
      detractor?: string; // 0-6
      passive?: string; // 7-8
      promoter?: string; // 9-10
    };
  };
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  config: {
    multiline: boolean;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  config: {
    options: Array<{
      id: string;
      label: string;
      value: string;
    }>;
    allowMultiple: boolean;
    allowOther: boolean;
  };
}

export type Question =
  | RatingQuestion
  | NPSQuestion
  | TextQuestion
  | MultipleChoiceQuestion;

// Conditional Logic
export interface ConditionalRule {
  id: string;
  questionId: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: string | number;
  action: "show" | "hide" | "skip_to";
  targetQuestionId?: string;
}

// Survey Branding
export interface SurveyBranding {
  logo?: string;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  showProgressBar?: boolean;
  showQuestionNumbers?: boolean;
}

// Thank You Configuration
export interface ThankYouConfig {
  title: string;
  message: string;
  showSocialShare?: boolean;
  redirectUrl?: string;
  redirectDelay?: number; // seconds
  showReviewRedirect?: boolean;
  reviewRedirectRating?: number; // redirect to review site if rating >= this
}

// Survey Template
export interface SurveyTemplate {
  id?: string;
  organizationId?: string;
  name: string;
  description?: string;
  questions: Question[];
  conditionalRules?: ConditionalRule[];
  branding?: SurveyBranding;
  thankYouConfig?: ThankYouConfig;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// Survey Response Answer
export interface SurveyAnswer {
  questionId: string;
  questionType: QuestionType;
  value: string | number | string[];
}

// Helper function to create a new question with defaults
export function createDefaultQuestion(type: QuestionType, order: number): Question {
  const id = globalThis.crypto.randomUUID();
  const baseQuestion = {
    id,
    title: "",
    required: true,
    order,
  };

  switch (type) {
    case "rating":
      return {
        ...baseQuestion,
        type: "rating",
        config: {
          maxRating: 5,
          labels: {
            low: "Poor",
            high: "Excellent",
          },
        },
      };
    case "nps":
      return {
        ...baseQuestion,
        type: "nps",
        config: {
          labels: {
            detractor: "Not likely",
            passive: "Neutral",
            promoter: "Very likely",
          },
        },
      };
    case "text":
      return {
        ...baseQuestion,
        type: "text",
        config: {
          multiline: true,
          placeholder: "Enter your response...",
        },
      };
    case "multiple_choice":
      return {
        ...baseQuestion,
        type: "multiple_choice",
        config: {
          options: [
            { id: globalThis.crypto.randomUUID(), label: "Option 1", value: "option_1" },
            { id: globalThis.crypto.randomUUID(), label: "Option 2", value: "option_2" },
          ],
          allowMultiple: false,
          allowOther: false,
        },
      };
  }
}

// Default survey templates
type DefaultTemplateData = Omit<SurveyTemplate, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">;

export const DEFAULT_TEMPLATES: Record<string, DefaultTemplateData> = {
  POST_TRANSACTION: {
    name: "Post-Transaction Survey",
    description: "Comprehensive feedback survey sent after loan closing",
    isActive: true,
    isDefault: true,
    questions: [
      {
        id: "pt-rating",
        type: "rating",
        title: "How would you rate your overall experience?",
        description: "Please rate your experience from 1 (poor) to 5 (excellent)",
        required: true,
        order: 0,
        config: {
          maxRating: 5,
          labels: { low: "Poor", high: "Excellent" },
        },
      },
      {
        id: "pt-nps",
        type: "nps",
        title: "How likely are you to recommend us to friends and family?",
        description: "On a scale of 0-10",
        required: true,
        order: 1,
        config: {
          labels: {
            detractor: "Not at all likely",
            passive: "Neutral",
            promoter: "Extremely likely",
          },
        },
      },
      {
        id: "pt-service",
        type: "multiple_choice",
        title: "What aspects of our service impressed you the most?",
        description: "Select all that apply",
        required: false,
        order: 2,
        config: {
          options: [
            { id: "comm", label: "Communication", value: "communication" },
            { id: "speed", label: "Speed of process", value: "speed" },
            { id: "prof", label: "Professionalism", value: "professionalism" },
            { id: "know", label: "Knowledge & expertise", value: "knowledge" },
            { id: "rates", label: "Competitive rates", value: "rates" },
          ],
          allowMultiple: true,
          allowOther: true,
        },
      },
      {
        id: "pt-feedback",
        type: "text",
        title: "Is there anything else you'd like to share about your experience?",
        description: "Your feedback helps us improve",
        required: false,
        order: 3,
        config: {
          multiline: true,
          placeholder: "Share your thoughts...",
          maxLength: 1000,
        },
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thank you for your feedback!",
      message: "We appreciate you taking the time to share your experience with us.",
      showReviewRedirect: true,
      reviewRedirectRating: 4,
    },
  },
  NPS: {
    name: "NPS Survey",
    description: "Quick Net Promoter Score survey",
    isActive: true,
    isDefault: false,
    questions: [
      {
        id: "nps-main",
        type: "nps",
        title: "How likely are you to recommend us to a friend or colleague?",
        required: true,
        order: 0,
        config: {
          labels: {
            detractor: "Not at all likely",
            passive: "Neutral",
            promoter: "Extremely likely",
          },
        },
      },
      {
        id: "nps-reason",
        type: "text",
        title: "What's the primary reason for your score?",
        required: false,
        order: 1,
        config: {
          multiline: true,
          placeholder: "Help us understand your rating...",
        },
      },
    ],
    branding: {
      showProgressBar: false,
      showQuestionNumbers: false,
    },
    thankYouConfig: {
      title: "Thank you!",
      message: "Your feedback is valuable to us.",
      showReviewRedirect: true,
      reviewRedirectRating: 9,
    },
  },
  CSAT: {
    name: "CSAT Survey",
    description: "Customer Satisfaction survey with rating scale",
    isActive: true,
    isDefault: false,
    questions: [
      {
        id: "csat-rating",
        type: "rating",
        title: "How satisfied are you with our service?",
        required: true,
        order: 0,
        config: {
          maxRating: 5,
          labels: {
            low: "Very dissatisfied",
            high: "Very satisfied",
          },
        },
      },
      {
        id: "csat-improve",
        type: "multiple_choice",
        title: "What could we do better?",
        description: "Select all areas for improvement",
        required: false,
        order: 1,
        config: {
          options: [
            { id: "resp", label: "Response time", value: "response_time" },
            { id: "comm", label: "Communication", value: "communication" },
            { id: "proc", label: "Process efficiency", value: "process" },
            { id: "docs", label: "Documentation", value: "documentation" },
            { id: "supp", label: "Support availability", value: "support" },
          ],
          allowMultiple: true,
          allowOther: true,
        },
      },
      {
        id: "csat-comments",
        type: "text",
        title: "Additional comments",
        required: false,
        order: 2,
        config: {
          multiline: true,
          placeholder: "Any other feedback...",
          maxLength: 500,
        },
      },
    ],
    branding: {
      showProgressBar: true,
      showQuestionNumbers: true,
    },
    thankYouConfig: {
      title: "Thanks for your feedback!",
      message: "Your satisfaction is our priority.",
      showReviewRedirect: true,
      reviewRedirectRating: 4,
    },
  },
};

// Zod Schemas for validation
const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
});

const ratingQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("rating"),
  title: z.string().min(1, "Question title is required"),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  config: z.object({
    maxRating: z.number().min(1).max(10),
    labels: z.object({
      low: z.string().optional(),
      high: z.string().optional(),
    }).optional(),
  }),
});

const npsQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("nps"),
  title: z.string().min(1, "Question title is required"),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  config: z.object({
    labels: z.object({
      detractor: z.string().optional(),
      passive: z.string().optional(),
      promoter: z.string().optional(),
    }).optional(),
  }),
});

const textQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  title: z.string().min(1, "Question title is required"),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  config: z.object({
    multiline: z.boolean(),
    placeholder: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
  }),
});

const multipleChoiceQuestionSchema = z.object({
  id: z.string(),
  type: z.literal("multiple_choice"),
  title: z.string().min(1, "Question title is required"),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  config: z.object({
    options: z.array(questionOptionSchema).min(1, "At least one option is required"),
    allowMultiple: z.boolean(),
    allowOther: z.boolean(),
  }),
});

export const questionSchema = z.discriminatedUnion("type", [
  ratingQuestionSchema,
  npsQuestionSchema,
  textQuestionSchema,
  multipleChoiceQuestionSchema,
]);

export const surveyBrandingSchema = z.object({
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().optional(),
  showProgressBar: z.boolean().optional(),
  showQuestionNumbers: z.boolean().optional(),
});

export const thankYouConfigSchema = z.object({
  title: z.string().min(1, "Thank you title is required"),
  message: z.string().min(1, "Thank you message is required"),
  showSocialShare: z.boolean().optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  redirectDelay: z.number().min(0).max(60).optional(),
  showReviewRedirect: z.boolean().optional(),
  reviewRedirectRating: z.number().min(1).max(10).optional(),
});

export const createSurveyTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(500).optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
  branding: surveyBrandingSchema.optional(),
  thankYouConfig: thankYouConfigSchema.optional(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

export const updateSurveyTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Template name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required").optional(),
  branding: surveyBrandingSchema.optional(),
  thankYouConfig: thankYouConfigSchema.optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// Input types derived from schemas
export type CreateSurveyTemplateInput = z.infer<typeof createSurveyTemplateSchema>;
export type UpdateSurveyTemplateInput = z.infer<typeof updateSurveyTemplateSchema>;
