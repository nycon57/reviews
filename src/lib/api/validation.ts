/**
 * REST API Validation Schemas
 * Zod schemas for validating API request bodies
 */

import { z } from 'zod';

// Common validators
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^[+]?[\d\s()-]+$/).optional();
const urlSchema = z.string().url().optional();
const dateSchema = z.string().datetime().optional();

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
});

// ============================================================================
// Survey Schemas
// ============================================================================

export const createSurveySchema = z
  .object({
    loan_officer_id: uuidSchema.optional(),
    loan_officer_email: emailSchema.optional(),
    template_id: uuidSchema.optional(),
    customer_name: z.string().min(1, 'Customer name is required').max(200),
    customer_email: emailSchema,
    customer_phone: phoneSchema,
    transaction_id: z.string().max(100).optional(),
    transaction_type: z.string().max(50).optional(),
    transaction_date: dateSchema,
    delay_hours: z.number().int().min(0).max(168).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => data.loan_officer_id || data.loan_officer_email,
    {
      message: 'Either loan_officer_id or loan_officer_email is required',
      path: ['loan_officer_id'],
    }
  );

export const updateSurveySchema = z.object({
  status: z.enum(['pending', 'sent', 'completed', 'expired', 'cancelled']).optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

// ============================================================================
// Branch Schemas
// ============================================================================

const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .max(100)
    .optional(),
  address: addressSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  website_url: urlSchema,
  manager_name: z.string().max(200).optional(),
  manager_email: emailSchema.optional(),
  region: z.string().max(100).optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: addressSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  website_url: urlSchema.nullable(),
  manager_name: z.string().max(200).optional().nullable(),
  manager_email: emailSchema.optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

// ============================================================================
// Review Schemas
// ============================================================================

export const updateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
});

export const reviewResponseSchema = z.object({
  response_text: z.string().min(1, 'Response text is required').max(5000),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewResponseInput = z.infer<typeof reviewResponseSchema>;

// ============================================================================
// Loan Officer Schemas
// ============================================================================

export const updateLoanOfficerSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  phone: phoneSchema,
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  branch_id: uuidSchema.optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateLoanOfficerInput = z.infer<typeof updateLoanOfficerSchema>;

// ============================================================================
// Organization Schemas
// ============================================================================

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo_url: urlSchema.nullable(),
  website_url: urlSchema.nullable(),
  timezone: z.string().max(50).optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

// ============================================================================
// User Schemas
// ============================================================================

export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'user']),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

// ============================================================================
// Filter Schemas
// ============================================================================

export const surveyFiltersSchema = z.object({
  status: z.enum(['pending', 'sent', 'completed', 'expired', 'cancelled']).optional(),
  loan_officer_id: uuidSchema.optional(),
  template_id: uuidSchema.optional(),
  created_after: dateSchema,
  created_before: dateSchema,
  search: z.string().max(200).optional(),
});

export const reviewFiltersSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
  platform: z.string().max(50).optional(),
  loan_officer_id: uuidSchema.optional(),
  branch_id: uuidSchema.optional(),
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  max_rating: z.coerce.number().int().min(1).max(5).optional(),
  created_after: dateSchema,
  created_before: dateSchema,
  search: z.string().max(200).optional(),
});

export const branchFiltersSchema = z.object({
  is_active: z.enum(['true', 'false']).optional(),
  region: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
});

export const loanOfficerFiltersSchema = z.object({
  is_active: z.enum(['true', 'false']).optional(),
  branch_id: uuidSchema.optional(),
  search: z.string().max(200).optional(),
});

export const userFiltersSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  search: z.string().max(200).optional(),
});

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate request body against a schema
 * Returns either parsed data or array of error messages
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.') || 'body',
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * Parse and validate URL search params against a schema
 */
export function validateParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  // Convert URLSearchParams to object
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(schema, params);
}
