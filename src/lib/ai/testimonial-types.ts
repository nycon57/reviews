// Testimonial Generator Types

import type { SentimentLabel, ReviewTheme } from './types';

// Testimonial format options
export type TestimonialFormat = 'short' | 'medium' | 'long' | 'social' | 'headline';

// Testimonial status
export type TestimonialStatus = 'draft' | 'approved' | 'rejected' | 'published';

// Testimonial database record
export interface Testimonial {
  id: string;
  organizationId: string;
  reviewId: string;
  loanOfficerId: string | null;
  format: TestimonialFormat;
  content: string;
  originalQuote: string | null;
  keyHighlights: string[];
  aiGenerated: boolean;
  generationPrompt: string | null;
  status: TestimonialStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  publishedPlatforms: string[];
  lastExportedAt: string | null;
  exportCount: number;
  createdAt: string;
  updatedAt: string;
  // Joined relations
  review?: {
    id: string;
    rating: number;
    text: string | null;
    customerName: string | null;
    source: string;
    reviewDate: string;
  };
  loanOfficer?: {
    id: string;
    fullName: string;
    photoUrl: string | null;
  };
}

// Testimonial graphic record
export interface TestimonialGraphic {
  id: string;
  testimonialId: string;
  organizationId: string;
  imageUrl: string | null;
  imageData: string | null;
  width: number;
  height: number;
  format: string;
  templateName: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  createdAt: string;
}

// Testimonial template record
export interface TestimonialTemplate {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  format: TestimonialFormat;
  promptTemplate: string;
  exampleOutput: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review context for testimonial generation
export interface TestimonialReviewContext {
  id: string;
  text: string | null;
  rating: number;
  customerName: string | null;
  customerLocation: string | null;
  loanOfficerName: string;
  source: string;
  reviewDate: string;
  sentimentScore: number | null;
  sentimentLabel: SentimentLabel | null;
  themes: ReviewTheme[];
  keyPhrases: string[];
}

// Generated testimonial result from AI
export interface GeneratedTestimonial {
  content: string;
  format: TestimonialFormat;
  originalQuote: string;
  keyHighlights: string[];
  confidence: number;
}

// Multi-format generation result
export interface TestimonialGenerationResult {
  reviewId: string;
  testimonials: GeneratedTestimonial[];
  suggestedFormat: TestimonialFormat;
  generationTime: number;
  error?: string;
}

// Graphic generation options
export interface GraphicGenerationOptions {
  width?: number;
  height?: number;
  template?: 'default' | 'modern' | 'minimal' | 'bold';
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  includePhoto?: boolean;
  includeLogo?: boolean;
  includeRating?: boolean;
}

// Graphic generation result
export interface GeneratedGraphic {
  imageData: string; // Base64 encoded SVG/PNG
  width: number;
  height: number;
  format: string;
  templateName: string;
}

// Export format options
export type ExportFormat = 'text' | 'html' | 'json' | 'csv' | 'image';

// Export platform options
export type ExportPlatform =
  | 'website'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'email'
  | 'print';

// Export options
export interface TestimonialExportOptions {
  format: ExportFormat;
  platform?: ExportPlatform;
  includeCustomerName?: boolean;
  includeLoanOfficerName?: boolean;
  includeRating?: boolean;
  includeDate?: boolean;
}

// Export result
export interface TestimonialExportResult {
  content: string;
  format: ExportFormat;
  platform?: ExportPlatform;
  metadata: {
    testimonialId: string;
    generatedAt: string;
    characterCount: number;
  };
}

// Filter options for testimonial queries
export interface TestimonialFilters {
  status?: TestimonialStatus | 'all';
  format?: TestimonialFormat | 'all';
  loanOfficerId?: string;
  reviewId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'approvedAt';
  sortOrder?: 'asc' | 'desc';
}

// Testimonial statistics
export interface TestimonialStats {
  total: number;
  byStatus: Record<TestimonialStatus, number>;
  byFormat: Record<TestimonialFormat, number>;
  totalExports: number;
  approvalRate: number;
  averageGenerationTime: number;
}

// Action result type
export interface TestimonialActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Batch generation request
export interface BatchGenerationRequest {
  reviewIds: string[];
  formats: TestimonialFormat[];
  autoApproveHighConfidence?: boolean;
  confidenceThreshold?: number;
}

// Batch generation result
export interface BatchGenerationResult {
  total: number;
  successful: number;
  failed: number;
  results: TestimonialGenerationResult[];
}
