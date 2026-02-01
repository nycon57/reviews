/**
 * OpenAPI Registry
 * Registers all Zod schemas for OpenAPI spec generation
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Create the registry
export const registry = new OpenAPIRegistry();

// ============================================================================
// Common Schemas
// ============================================================================

const ErrorSchema = z
  .object({
    code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Invalid request body' }),
    details: z.record(z.unknown()).optional(),
  })
  .openapi('Error');

const PaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    page_size: z.number().int().openapi({ example: 25 }),
    total: z.number().int().openapi({ example: 142 }),
    total_pages: z.number().int().openapi({ example: 6 }),
    has_more: z.boolean().openapi({ example: true }),
  })
  .openapi('Pagination');

const MetaSchema = z
  .object({
    request_id: z.string().openapi({ example: 'req_abc123xyz' }),
    timestamp: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
  })
  .openapi('Meta');

// Register common schemas
registry.register('Error', ErrorSchema);
registry.register('Pagination', PaginationSchema);
registry.register('Meta', MetaSchema);

// ============================================================================
// Survey Schemas
// ============================================================================

const SurveySchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    template_id: z.string().uuid(),
    user_id: z.string().uuid(),
    customer_name: z.string(),
    customer_email: z.string().email(),
    customer_phone: z.string().nullable(),
    transaction_id: z.string().nullable(),
    transaction_type: z.string().nullable(),
    transaction_date: z.string().nullable(),
    status: z.enum(['pending', 'sent', 'completed', 'expired', 'cancelled']),
    sent_at: z.string().datetime().nullable(),
    completed_at: z.string().datetime().nullable(),
    expires_at: z.string().datetime().nullable(),
    source: z.string().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Survey');

const CreateSurveySchema = z
  .object({
    user_id: z.string().uuid().optional().openapi({
      description: 'UUID of the professional. Required if user_email is not provided.',
    }),
    user_email: z.string().email().optional().openapi({
      description: 'Email of the professional. Used to look up the user if ID is not provided.',
    }),
    template_id: z.string().uuid().optional().openapi({
      description: 'UUID of the survey template. Uses default template if not provided.',
    }),
    customer_name: z.string().min(1).max(200).openapi({
      example: 'John Smith',
    }),
    customer_email: z.string().email().openapi({
      example: 'john.smith@example.com',
    }),
    customer_phone: z.string().optional().openapi({
      example: '+1 (555) 123-4567',
    }),
    transaction_id: z.string().max(100).optional().openapi({
      description: 'Your internal transaction/loan ID',
      example: 'LOAN-2024-001',
    }),
    transaction_type: z.string().max(50).optional().openapi({
      example: 'Purchase',
    }),
    transaction_date: z.string().datetime().optional(),
    delay_hours: z.number().int().min(0).max(168).optional().openapi({
      description: 'Hours to delay sending the survey (0-168)',
      example: 24,
    }),
    metadata: z.record(z.unknown()).optional().openapi({
      description: 'Additional metadata to store with the survey',
    }),
  })
  .openapi('CreateSurveyInput');

registry.register('Survey', SurveySchema);
registry.register('CreateSurveyInput', CreateSurveySchema);

// ============================================================================
// Review Schemas
// ============================================================================

const ReviewSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    user_id: z.string().uuid().nullable(),
    branch_id: z.string().uuid().nullable(),
    platform: z.string().openapi({ example: 'google' }),
    platform_review_id: z.string().nullable(),
    rating: z.number().int().min(1).max(5),
    review_text: z.string().nullable(),
    reviewer_name: z.string().nullable(),
    review_date: z.string().datetime(),
    response_text: z.string().nullable(),
    response_date: z.string().datetime().nullable(),
    status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
    sentiment_score: z.number().nullable(),
    sentiment_label: z.string().nullable(),
    key_phrases: z.array(z.string()).nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Review');

const ReviewResponseSchema = z
  .object({
    response_text: z.string().min(1).max(5000).openapi({
      description: 'The response text to post to the review',
      example: 'Thank you for your kind words! We appreciate your business.',
    }),
  })
  .openapi('ReviewResponseInput');

registry.register('Review', ReviewSchema);
registry.register('ReviewResponseInput', ReviewResponseSchema);

// ============================================================================
// Branch Schemas
// ============================================================================

const AddressSchema = z
  .object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    postal_code: z.string().max(20).optional(),
    country: z.string().max(50).optional(),
  })
  .openapi('Address');

const BranchSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    address: AddressSchema.nullable(),
    phone: z.string().nullable(),
    email: z.string().email().nullable(),
    website_url: z.string().url().nullable(),
    manager_name: z.string().nullable(),
    manager_email: z.string().email().nullable(),
    region: z.string().nullable(),
    is_active: z.boolean(),
    average_rating: z.number().nullable(),
    total_reviews: z.number().int(),
    total_members: z.number().int(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Branch');

const CreateBranchSchema = z
  .object({
    name: z.string().min(1).max(200).openapi({ example: 'Downtown Branch' }),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(100)
      .optional()
      .openapi({ example: 'downtown-branch' }),
    address: AddressSchema.optional(),
    phone: z.string().optional().openapi({ example: '+1 (555) 123-4567' }),
    email: z.string().email().optional().openapi({ example: 'downtown@example.com' }),
    website_url: z.string().url().optional(),
    manager_name: z.string().max(200).optional(),
    manager_email: z.string().email().optional(),
    region: z.string().max(100).optional().openapi({ example: 'West Coast' }),
  })
  .openapi('CreateBranchInput');

registry.register('Address', AddressSchema);
registry.register('Branch', BranchSchema);
registry.register('CreateBranchInput', CreateBranchSchema);

// ============================================================================
// Professional Schemas
// ============================================================================

const ProfessionalSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    branch_id: z.string().uuid().nullable(),
    user_id: z.string().uuid().nullable(),
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    title: z.string().nullable(),
    nmls_id: z.string().nullable(),
    bio: z.string().nullable(),
    photo_url: z.string().url().nullable(),
    is_active: z.boolean(),
    average_rating: z.number().nullable(),
    total_reviews: z.number().int(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Professional');

const UpdateProfessionalSchema = z
  .object({
    full_name: z.string().min(1).max(200).optional(),
    phone: z.string().optional().nullable(),
    title: z.string().max(100).optional().nullable(),
    bio: z.string().max(2000).optional().nullable(),
    branch_id: z.string().uuid().optional().nullable(),
    is_active: z.boolean().optional(),
  })
  .openapi('UpdateProfessionalInput');

registry.register('Professional', ProfessionalSchema);
registry.register('UpdateProfessionalInput', UpdateProfessionalSchema);

// Deprecated aliases for backward compatibility
/** @deprecated Use ProfessionalSchema instead */
const LoanOfficerSchema = ProfessionalSchema;
/** @deprecated Use UpdateProfessionalSchema instead */
const UpdateLoanOfficerSchema = UpdateProfessionalSchema;

registry.register('LoanOfficer', LoanOfficerSchema);
registry.register('UpdateLoanOfficerInput', UpdateLoanOfficerSchema);

// ============================================================================
// Organization Schemas
// ============================================================================

const OrganizationSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    logo_url: z.string().url().nullable(),
    website_url: z.string().url().nullable(),
    industry: z.string().nullable(),
    timezone: z.string(),
    settings: z.record(z.unknown()),
    is_active: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .openapi('Organization');

registry.register('Organization', OrganizationSchema);

// ============================================================================
// User Schemas
// ============================================================================

const UserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().nullable(),
    role: z.enum(['admin', 'manager', 'user']),
    is_active: z.boolean(),
    avatar_url: z.string().url().nullable(),
    last_login_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
  })
  .openapi('User');

const InviteUserSchema = z
  .object({
    email: z.string().email().openapi({ example: 'newuser@example.com' }),
    role: z.enum(['admin', 'manager', 'user']).openapi({ example: 'user' }),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
  })
  .openapi('InviteUserInput');

registry.register('User', UserSchema);
registry.register('InviteUserInput', InviteUserSchema);

// ============================================================================
// API Response Wrappers
// ============================================================================

function createListResponse<T extends z.ZodTypeAny>(schema: T, name: string) {
  return z
    .object({
      success: z.literal(true),
      data: z.array(schema),
      pagination: PaginationSchema,
      meta: MetaSchema,
    })
    .openapi(`${name}ListResponse`);
}

function createSingleResponse<T extends z.ZodTypeAny>(schema: T, name: string) {
  return z
    .object({
      success: z.literal(true),
      data: schema,
      meta: MetaSchema,
    })
    .openapi(`${name}Response`);
}

function createErrorResponse() {
  return z
    .object({
      success: z.literal(false),
      error: ErrorSchema,
      meta: MetaSchema,
    })
    .openapi('ErrorResponse');
}

// Register response schemas
registry.register('SurveyListResponse', createListResponse(SurveySchema, 'Survey'));
registry.register('SurveyResponse', createSingleResponse(SurveySchema, 'Survey'));
registry.register('ReviewListResponse', createListResponse(ReviewSchema, 'Review'));
registry.register('ReviewResponse', createSingleResponse(ReviewSchema, 'Review'));
registry.register('BranchListResponse', createListResponse(BranchSchema, 'Branch'));
registry.register('BranchResponse', createSingleResponse(BranchSchema, 'Branch'));
registry.register('ProfessionalListResponse', createListResponse(ProfessionalSchema, 'Professional'));
registry.register('ProfessionalResponse', createSingleResponse(ProfessionalSchema, 'Professional'));
// Deprecated aliases
registry.register('LoanOfficerListResponse', createListResponse(LoanOfficerSchema, 'LoanOfficer'));
registry.register('LoanOfficerResponse', createSingleResponse(LoanOfficerSchema, 'LoanOfficer'));
registry.register('UserListResponse', createListResponse(UserSchema, 'User'));
registry.register('OrganizationResponse', createSingleResponse(OrganizationSchema, 'Organization'));
registry.register('ErrorResponse', createErrorResponse());

// ============================================================================
// Security Schemes
// ============================================================================

registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
  description: 'API key for authentication. Get your key from the API Keys settings page.',
});

// ============================================================================
// API Paths
// ============================================================================

// Surveys
registry.registerPath({
  method: 'get',
  path: '/api/v1/surveys',
  summary: 'List surveys',
  description: 'Get a paginated list of surveys for your organization',
  tags: ['Surveys'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      status: z.enum(['pending', 'sent', 'completed', 'expired', 'cancelled']).optional(),
      user_id: z.string().uuid().optional(),
      search: z.string().max(200).optional(),
      sort_by: z.enum(['created_at', 'sent_at', 'completed_at', 'customer_name', 'status']).optional(),
      sort_order: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of surveys',
      content: {
        'application/json': {
          schema: createListResponse(SurveySchema, 'Survey'),
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing API key',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/surveys',
  summary: 'Create a survey',
  description: 'Create a new survey and add it to the distribution queue',
  tags: ['Surveys'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateSurveySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Survey created successfully',
      content: {
        'application/json': {
          schema: createSingleResponse(SurveySchema, 'Survey'),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/surveys/{id}',
  summary: 'Get a survey',
  description: 'Get details of a specific survey',
  tags: ['Surveys'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Survey details',
      content: {
        'application/json': {
          schema: createSingleResponse(SurveySchema, 'Survey'),
        },
      },
    },
    404: {
      description: 'Survey not found',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
  },
});

// Reviews
registry.registerPath({
  method: 'get',
  path: '/api/v1/reviews',
  summary: 'List reviews',
  description: 'Get a paginated list of reviews for your organization',
  tags: ['Reviews'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
      platform: z.string().max(50).optional(),
      user_id: z.string().uuid().optional(),
      branch_id: z.string().uuid().optional(),
      min_rating: z.coerce.number().int().min(1).max(5).optional(),
      max_rating: z.coerce.number().int().min(1).max(5).optional(),
      search: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of reviews',
      content: {
        'application/json': {
          schema: createListResponse(ReviewSchema, 'Review'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/reviews/{id}/respond',
  summary: 'Respond to a review',
  description: 'Post a response to a review',
  tags: ['Reviews'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: ReviewResponseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Response posted successfully',
      content: {
        'application/json': {
          schema: createSingleResponse(ReviewSchema, 'Review'),
        },
      },
    },
  },
});

// Branches
registry.registerPath({
  method: 'get',
  path: '/api/v1/branches',
  summary: 'List branches',
  description: 'Get a paginated list of branches for your organization',
  tags: ['Branches'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      is_active: z.enum(['true', 'false']).optional(),
      region: z.string().max(100).optional(),
      search: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of branches',
      content: {
        'application/json': {
          schema: createListResponse(BranchSchema, 'Branch'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/branches',
  summary: 'Create a branch',
  description: 'Create a new branch',
  tags: ['Branches'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBranchSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Branch created successfully',
      content: {
        'application/json': {
          schema: createSingleResponse(BranchSchema, 'Branch'),
        },
      },
    },
  },
});

// Professionals
registry.registerPath({
  method: 'get',
  path: '/api/v1/professionals',
  summary: 'List professionals',
  description: 'Get a paginated list of professionals for your organization',
  tags: ['Professionals'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      is_active: z.enum(['true', 'false']).optional(),
      branch_id: z.string().uuid().optional(),
      search: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of professionals',
      content: {
        'application/json': {
          schema: createListResponse(ProfessionalSchema, 'Professional'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/professionals/{id}',
  summary: 'Get a professional',
  description: 'Get details of a specific professional',
  tags: ['Professionals'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Professional details',
      content: {
        'application/json': {
          schema: createSingleResponse(ProfessionalSchema, 'Professional'),
        },
      },
    },
    404: {
      description: 'Professional not found',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/professionals/{id}',
  summary: 'Update a professional',
  description: 'Update details of a specific professional',
  tags: ['Professionals'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateProfessionalSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Professional updated successfully',
      content: {
        'application/json': {
          schema: createSingleResponse(ProfessionalSchema, 'Professional'),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
    404: {
      description: 'Professional not found',
      content: {
        'application/json': {
          schema: createErrorResponse(),
        },
      },
    },
  },
});

// Loan Officers (deprecated - use /professionals instead)
registry.registerPath({
  method: 'get',
  path: '/api/v1/loan-officers',
  summary: 'List loan officers (deprecated)',
  description: 'Get a paginated list of loan officers for your organization. **Deprecated: Use /api/v1/professionals instead.**',
  tags: ['Loan Officers (Deprecated)'],
  deprecated: true,
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      is_active: z.enum(['true', 'false']).optional(),
      branch_id: z.string().uuid().optional(),
      search: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of loan officers',
      content: {
        'application/json': {
          schema: createListResponse(LoanOfficerSchema, 'LoanOfficer'),
        },
      },
    },
  },
});

// Organization
registry.registerPath({
  method: 'get',
  path: '/api/v1/organization',
  summary: 'Get organization',
  description: 'Get your organization details',
  tags: ['Organization'],
  security: [{ ApiKeyAuth: [] }],
  responses: {
    200: {
      description: 'Organization details',
      content: {
        'application/json': {
          schema: createSingleResponse(OrganizationSchema, 'Organization'),
        },
      },
    },
  },
});

// Users
registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  summary: 'List users',
  description: 'Get a paginated list of users in your organization',
  tags: ['Users'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      page_size: z.coerce.number().int().min(1).max(100).default(25).optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
      is_active: z.enum(['true', 'false']).optional(),
      search: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: createListResponse(UserSchema, 'User'),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/users/invite',
  summary: 'Invite a user',
  description: 'Invite a new user to your organization',
  tags: ['Users'],
  security: [{ ApiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: InviteUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User invited successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              role: z.string(),
              status: z.string(),
              created_at: z.string().datetime(),
            }),
            meta: MetaSchema,
          }),
        },
      },
    },
  },
});

// ============================================================================
// Webhook Event Schemas
// ============================================================================

const WebhookEventSchema = z
  .object({
    event: z.string().openapi({ example: 'survey.completed' }),
    timestamp: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
    data: z.record(z.unknown()),
  })
  .openapi('WebhookEvent');

registry.register('WebhookEvent', WebhookEventSchema);

// Webhook event types documentation
const webhookEventTypes = [
  {
    event: 'survey.created',
    description: 'Triggered when a new survey is created',
  },
  {
    event: 'survey.sent',
    description: 'Triggered when a survey email is sent to a customer',
  },
  {
    event: 'survey.completed',
    description: 'Triggered when a customer completes a survey',
  },
  {
    event: 'survey.expired',
    description: 'Triggered when a survey expires without completion',
  },
  {
    event: 'review.received',
    description: 'Triggered when a new review is received from any platform',
  },
  {
    event: 'review.responded',
    description: 'Triggered when a response is posted to a review',
  },
  {
    event: 'review.flagged',
    description: 'Triggered when a review is flagged for attention',
  },
];

// Export webhook event types for documentation
export { webhookEventTypes };

// ============================================================================
// Generator
// ============================================================================

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'RepWell API',
      version: '1.0.0',
      description: `
# RepWell Public API

Welcome to the RepWell API! This API allows you to integrate RepWell's customer experience and review management capabilities into your applications.

## Authentication

All API requests require authentication via an API key. Include your API key in the \`X-API-Key\` header:

\`\`\`
X-API-Key: rw_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`

You can manage your API keys in the [API Keys settings](/dashboard/settings/api-keys) page.

## Rate Limiting

API requests are rate limited based on your plan:
- **Basic**: 100 requests/hour
- **Pro**: 1,000 requests/hour
- **Enterprise**: 10,000 requests/hour

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Your rate limit
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Time when the limit resets (Unix timestamp)

## Pagination

List endpoints return paginated results. Use these query parameters:
- \`page\`: Page number (default: 1)
- \`page_size\`: Items per page (default: 25, max: 100)

Pagination info is returned in the \`pagination\` object.

## Errors

Errors are returned with appropriate HTTP status codes and a JSON body:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": { ... }
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

Common error codes:
- \`UNAUTHORIZED\`: Invalid or missing API key
- \`FORBIDDEN\`: Insufficient permissions
- \`NOT_FOUND\`: Resource not found
- \`VALIDATION_ERROR\`: Invalid request data
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
      `.trim(),
      contact: {
        name: 'RepWell Support',
        email: 'support@repwell.com',
        url: 'https://repwell.com/support',
      },
    },
    servers: [
      {
        url: 'https://app.repwell.com',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
    ],
    tags: [
      { name: 'Surveys', description: 'Survey management endpoints' },
      { name: 'Reviews', description: 'Review management endpoints' },
      { name: 'Branches', description: 'Branch management endpoints' },
      { name: 'Professionals', description: 'Professional management endpoints' },
      { name: 'Organization', description: 'Organization settings endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Loan Officers (Deprecated)', description: 'Deprecated: Use /professionals endpoints instead' },
    ],
  });
}
