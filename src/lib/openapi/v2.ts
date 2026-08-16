import { getBaseUrl } from "@/lib/seo";

type OpenApiDocument = Record<string, unknown>;

const professionalSummarySchema = {
  type: "object",
  required: [
    "id",
    "full_name",
    "title",
    "company_name",
    "industry",
    "location",
    "average_rating",
    "total_reviews",
    "profile_url",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    full_name: { type: "string", example: "Jane Smith" },
    title: { type: ["string", "null"], example: "Senior Loan Officer" },
    company_name: { type: ["string", "null"], example: "Summit Mortgage" },
    industry: { type: ["string", "null"], example: "mortgage" },
    location: { type: ["string", "null"], example: "Chicago, IL" },
    average_rating: { type: ["number", "null"], example: 4.8 },
    total_reviews: { type: "integer", example: 47 },
    profile_url: { type: "string", format: "uri" },
  },
};

const reviewSchema = {
  type: "object",
  required: [
    "id",
    "rating",
    "review_text",
    "reviewer_name",
    "review_date",
    "platform",
    "sentiment_label",
    "key_phrases",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    rating: { type: "number", minimum: 1, maximum: 5 },
    review_text: { type: ["string", "null"], example: "Responsive and clear." },
    reviewer_name: { type: ["string", "null"], example: "Alex M." },
    review_date: { type: "string", format: "date-time" },
    platform: { type: "string", example: "google" },
    sentiment_label: { type: ["string", "null"], example: "positive" },
    key_phrases: {
      type: ["array", "null"],
      items: { type: "string" },
      example: ["responsive", "clear communication"],
    },
    verified: { type: "boolean" },
  },
};

const paginationFields = {
  total: { type: "integer", example: 142 },
  page: { type: "integer", example: 1 },
  per_page: { type: "integer", example: 20 },
  total_pages: { type: "integer", example: 8 },
};

const errorSchema = {
  type: "object",
  required: ["error", "message"],
  properties: {
    error: { type: "string", example: "invalid_query" },
    message: { type: "string", example: "per_page must be less than or equal to 50" },
  },
};

const rateLimitSchema = {
  type: "object",
  required: ["error", "retry_after"],
  properties: {
    error: { type: "string", const: "rate_limit_exceeded" },
    retry_after: { type: "integer", example: 45 },
  },
};

function paginatedSchema(itemSchema: unknown) {
  return {
    type: "object",
    required: ["data", "total", "page", "per_page", "total_pages"],
    properties: {
      data: {
        type: "array",
        items: itemSchema,
      },
      ...paginationFields,
    },
  };
}

const paginationParameters = (maxPerPage: number) => [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "per_page",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: maxPerPage, default: 20 },
  },
];

const commonResponses = {
  "400": {
    description: "Invalid query parameters",
    content: { "application/json": { schema: errorSchema } },
  },
  "429": {
    description: "Rate limit exceeded",
    headers: {
      "Retry-After": {
        schema: { type: "integer" },
        description: "Seconds until the client should retry.",
      },
    },
    content: { "application/json": { schema: rateLimitSchema } },
  },
  "500": {
    description: "Internal server error",
    content: { "application/json": { schema: errorSchema } },
  },
};

const unauthorizedResponse = {
  description: "API key required or invalid",
  content: {
    "application/json": {
      schema: errorSchema,
      examples: {
        apiKeyRequired: {
          value: {
            error: "api_key_required",
            message:
              "This endpoint requires an API key. Register at repwell.com/developers",
          },
        },
      },
    },
  },
};

export function generateOpenApiV2Spec(): OpenApiDocument {
  return {
    openapi: "3.1.0",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "RepWell Public API v2",
      version: "2.0.0",
      description:
        "Agent-facing public API for searching RepWell professionals, reviews, and company rollups. Open tier is limited to 60 requests/minute per IP. Keyed tier is limited to 300 requests/minute per API key; the existing v1 hourly key limiter also applies.",
    },
    servers: [{ url: getBaseUrl() }],
    paths: {
      "/api/v2/professionals": {
        get: {
          operationId: "searchProfessionalsV2",
          summary: "Search public professionals",
          description:
            "Open tier. No API key required. Returns active public professionals with at least one approved published review. Rate limit: 60 requests/minute per IP.",
          security: [],
          parameters: [
            { name: "name", in: "query", schema: { type: "string" } },
            { name: "industry", in: "query", schema: { type: "string" } },
            { name: "location", in: "query", schema: { type: "string" } },
            {
              name: "min_rating",
              in: "query",
              schema: { type: "number", minimum: 1, maximum: 5 },
            },
            {
              name: "sort_by",
              in: "query",
              schema: {
                type: "string",
                enum: ["rating", "reviews", "recent"],
                default: "rating",
              },
            },
            ...paginationParameters(50),
          ],
          responses: {
            "200": {
              description: "Paginated professional summaries",
              headers: {
                "X-RepWell-Source": { schema: { type: "string" } },
                "Cache-Control": { schema: { type: "string" } },
              },
              content: {
                "application/json": {
                  schema: paginatedSchema(professionalSummarySchema),
                  examples: {
                    searchByName: {
                      value: {
                        data: [
                          {
                            id: "4c9946e7-bde4-4dd9-b3f4-911bcf2beef6",
                            full_name: "Jane Smith",
                            title: "Senior Loan Officer",
                            company_name: "Summit Mortgage",
                            industry: "mortgage",
                            location: "Chicago, IL",
                            average_rating: 4.8,
                            total_reviews: 47,
                            profile_url: "https://repwell.com/pro/jane-smith",
                          },
                        ],
                        total: 1,
                        page: 1,
                        per_page: 20,
                        total_pages: 1,
                      },
                    },
                    empty: {
                      value: {
                        data: [],
                        total: 0,
                        page: 1,
                        per_page: 20,
                        total_pages: 0,
                      },
                    },
                  },
                },
              },
            },
            ...commonResponses,
          },
        },
      },
      "/api/v2/professionals/{id}": {
        get: {
          operationId: "getProfessionalV2",
          summary: "Get professional detail",
          description:
            "Keyed tier. Returns a public professional profile, up to 25 recent approved reviews, rating distribution, and recency stats. Rate limit: 300 requests/minute per API key.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": {
              description: "Professional detail",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: {
                      data: {
                        allOf: [
                          professionalSummarySchema,
                          {
                            type: "object",
                            properties: {
                              bio: { type: ["string", "null"] },
                              photo_url: { type: ["string", "null"], format: "uri" },
                              social_links: {
                                type: "object",
                                additionalProperties: { type: "string" },
                              },
                              nmls_id: { type: ["string", "null"] },
                              nps_score: { type: ["number", "null"] },
                              reputation_score: { type: ["number", "null"] },
                              reviews: { type: "array", items: reviewSchema },
                              rating_distribution: {
                                type: "object",
                                properties: {
                                  "1": { type: "integer" },
                                  "2": { type: "integer" },
                                  "3": { type: "integer" },
                                  "4": { type: "integer" },
                                  "5": { type: "integer" },
                                },
                              },
                              recency_stats: {
                                type: "object",
                                properties: {
                                  reviews_last_30_days: { type: "integer" },
                                  reviews_last_90_days: { type: "integer" },
                                  reviews_last_year: { type: "integer" },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            "401": unauthorizedResponse,
            "404": {
              description: "Professional not found or not public",
              content: { "application/json": { schema: errorSchema } },
            },
            ...commonResponses,
          },
        },
      },
      "/api/v2/professionals/{id}/reviews": {
        get: {
          operationId: "listProfessionalReviewsV2",
          summary: "List reviews for one professional",
          description:
            "Keyed tier. Returns approved published reviews for an active public professional. Rate limit: 300 requests/minute per API key.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            {
              name: "sort_by",
              in: "query",
              schema: {
                type: "string",
                enum: ["date_desc", "date_asc", "rating_desc", "rating_asc"],
                default: "date_desc",
              },
            },
            { name: "platform", in: "query", schema: { type: "string" } },
            {
              name: "min_rating",
              in: "query",
              schema: { type: "number", minimum: 1, maximum: 5 },
            },
            ...paginationParameters(100),
          ],
          responses: {
            "200": {
              description: "Paginated professional reviews",
              content: {
                "application/json": {
                  schema: paginatedSchema(reviewSchema),
                },
              },
            },
            "401": unauthorizedResponse,
            "404": {
              description: "Professional not found or inactive",
              content: { "application/json": { schema: errorSchema } },
            },
            ...commonResponses,
          },
        },
      },
      "/api/v2/reviews": {
        get: {
          operationId: "searchReviewsV2",
          summary: "Search reviews across professionals",
          description:
            "Keyed tier. Searches approved published reviews across active public professionals. Rate limit: 300 requests/minute per API key.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "keyword", in: "query", schema: { type: "string" } },
            { name: "platform", in: "query", schema: { type: "string" } },
            {
              name: "min_rating",
              in: "query",
              schema: { type: "number", minimum: 1, maximum: 5 },
            },
            {
              name: "max_rating",
              in: "query",
              schema: { type: "number", minimum: 1, maximum: 5 },
            },
            { name: "date_from", in: "query", schema: { type: "string", format: "date" } },
            { name: "date_to", in: "query", schema: { type: "string", format: "date" } },
            { name: "industry", in: "query", schema: { type: "string" } },
            { name: "location", in: "query", schema: { type: "string" } },
            {
              name: "sort_by",
              in: "query",
              schema: {
                type: "string",
                enum: ["date_desc", "date_asc", "rating_desc", "rating_asc"],
                default: "date_desc",
              },
            },
            ...paginationParameters(100),
          ],
          responses: {
            "200": {
              description: "Paginated cross-professional reviews",
              content: {
                "application/json": {
                  schema: paginatedSchema({
                    allOf: [
                      reviewSchema,
                      {
                        type: "object",
                        properties: {
                          professional: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              full_name: { type: "string" },
                              title: { type: ["string", "null"] },
                              company_name: { type: ["string", "null"] },
                              profile_url: { type: "string", format: "uri" },
                            },
                          },
                        },
                      },
                    ],
                  }),
                },
              },
            },
            "401": unauthorizedResponse,
            ...commonResponses,
          },
        },
      },
      "/api/v2/companies": {
        get: {
          operationId: "listCompaniesV2",
          summary: "List companies with aggregate metrics",
          description:
            "Keyed tier. Computes company rollups from approved published reviews for active public professionals. Companies with no active reviewed professionals are included with null aggregate rating. Rate limit: 300 requests/minute per API key.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "industry", in: "query", schema: { type: "string" } },
            {
              name: "min_avg_rating",
              in: "query",
              schema: { type: "number", minimum: 1, maximum: 5 },
            },
            {
              name: "sort_by",
              in: "query",
              schema: { type: "string", enum: ["rating", "size", "reviews"], default: "rating" },
            },
            ...paginationParameters(100),
          ],
          responses: {
            "200": {
              description: "Paginated companies",
              content: {
                "application/json": {
                  schema: paginatedSchema({ $ref: "#/components/schemas/CompanySummary" }),
                },
              },
            },
            "401": unauthorizedResponse,
            ...commonResponses,
          },
        },
      },
      "/api/v2/companies/{id}": {
        get: {
          operationId: "getCompanyV2",
          summary: "Get company detail",
          description:
            "Keyed tier. Returns company aggregate metrics and team roster summary. Rate limit: 300 requests/minute per API key.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            "200": {
              description: "Company detail",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: {
                      data: { $ref: "#/components/schemas/CompanyDetail" },
                    },
                  },
                },
              },
            },
            "401": unauthorizedResponse,
            "404": {
              description: "Company not found",
              content: { "application/json": { schema: errorSchema } },
            },
            ...commonResponses,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "RepWell API key",
        },
      },
      schemas: {
        CompanySummary: {
          type: "object",
          required: [
            "id",
            "name",
            "slug",
            "industry",
            "logo_url",
            "website_url",
            "professional_count",
            "avg_team_rating",
            "total_team_reviews",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Summit Mortgage" },
            slug: { type: "string", example: "summit-mortgage" },
            industry: { type: ["string", "null"], example: "mortgage" },
            logo_url: { type: ["string", "null"], format: "uri" },
            website_url: { type: ["string", "null"], format: "uri" },
            professional_count: { type: "integer", example: 8 },
            avg_team_rating: { type: ["number", "null"], example: 4.7 },
            total_team_reviews: { type: "integer", example: 180 },
          },
        },
        CompanyDetail: {
          allOf: [
            { $ref: "#/components/schemas/CompanySummary" },
            {
              type: "object",
              required: ["team"],
              properties: {
                team: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      full_name: { type: "string" },
                      title: { type: ["string", "null"] },
                      average_rating: { type: ["number", "null"] },
                      total_reviews: { type: "integer" },
                      profile_url: { type: "string", format: "uri" },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
}
