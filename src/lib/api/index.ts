/**
 * REST API Module
 * Public exports for the REST API
 */

// Types
export * from './types';

// Response utilities
export {
  apiSuccess,
  apiPaginated,
  apiError,
  apiValidationError,
  apiNotFound,
  apiForbidden,
  apiConflict,
  apiInternalError,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
  createCorsHeaders,
  handleOptionsRequest,
} from './response';

// Validation schemas and utilities
export {
  // Schemas
  paginationSchema,
  createSurveySchema,
  updateSurveySchema,
  createBranchSchema,
  updateBranchSchema,
  updateReviewSchema,
  reviewResponseSchema,
  updateLoanOfficerSchema,
  updateOrganizationSchema,
  inviteUserSchema,
  surveyFiltersSchema,
  reviewFiltersSchema,
  branchFiltersSchema,
  loanOfficerFiltersSchema,
  userFiltersSchema,
  // Utilities
  validateBody,
  validateParams,
  // Types
  type CreateSurveyInput,
  type UpdateSurveyInput,
  type CreateBranchInput,
  type UpdateBranchInput,
  type UpdateReviewInput,
  type ReviewResponseInput,
  type UpdateLoanOfficerInput,
  type UpdateOrganizationInput,
  type InviteUserInput,
} from './validation';
