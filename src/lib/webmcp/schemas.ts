type JsonSchema = {
  readonly $schema?: string;
  readonly type?: string | readonly string[];
  readonly title?: string;
  readonly description?: string;
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly items?: JsonSchema;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly default?: unknown;
};

const nullableString = (description: string): JsonSchema => ({
  type: ["string", "null"],
  description,
});

const nullableNumber = (description: string): JsonSchema => ({
  type: ["number", "null"],
  description,
});

const professionalSummarySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", description: "RepWell professional ID." },
    full_name: { type: "string", description: "Professional display name." },
    title: nullableString("Professional title."),
    company_name: nullableString("Company or organization name."),
    industry: nullableString("Professional industry."),
    location: nullableString("Public profile location."),
    average_rating: nullableNumber("Average public rating from approved reviews."),
    total_reviews: {
      type: "number",
      description: "Total approved public reviews.",
      minimum: 0,
    },
    profile_url: { type: "string", description: "Canonical public profile URL." },
  },
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
};

const reviewSummarySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", description: "Review ID." },
    rating: {
      type: "number",
      description: "Review star rating.",
      minimum: 1,
      maximum: 5,
    },
    review_text: nullableString("Approved public review text."),
    reviewer_name: nullableString("Public reviewer display name."),
    review_date: { type: "string", description: "Review date." },
    platform: { type: "string", description: "Source platform label." },
  },
  required: [
    "id",
    "rating",
    "review_text",
    "reviewer_name",
    "review_date",
    "platform",
  ],
};

const companyProfileSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", description: "RepWell company ID." },
    name: { type: "string", description: "Company display name." },
    slug: { type: "string", description: "Public company slug." },
    industry: nullableString("Company industry."),
    logo_url: nullableString("Public company logo URL."),
    website_url: nullableString("Public company website URL."),
    professional_count: {
      type: "number",
      description: "Count of active reviewed public professionals.",
      minimum: 0,
    },
    avg_team_rating: nullableNumber("Average rating across public team reviews."),
    total_team_reviews: {
      type: "number",
      description: "Total approved public team reviews.",
      minimum: 0,
    },
  },
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
};

const paginatedFields: Record<string, JsonSchema> = {
  total: { type: "number", description: "Total matching records.", minimum: 0 },
  page: { type: "number", description: "Current page.", minimum: 1 },
  per_page: { type: "number", description: "Records per page.", minimum: 1 },
  total_pages: { type: "number", description: "Total result pages.", minimum: 0 },
};

export const webMcpToolSchemas = [
  {
    name: "searchProfessionals",
    title: "Search RepWell professionals",
    description:
      "Search active public RepWell professionals by name, industry, location, and minimum rating.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Professional name search term." },
        industry: { type: "string", description: "Industry search term." },
        location: { type: "string", description: "City, state, branch, or location term." },
        min_rating: {
          type: "number",
          description: "Minimum average rating from 1 to 5.",
          minimum: 1,
          maximum: 5,
        },
      },
    } satisfies JsonSchema,
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        data: {
          type: "array",
          description: "Matching public professionals.",
          items: professionalSummarySchema,
        },
        ...paginatedFields,
      },
      required: ["data", "total", "page", "per_page", "total_pages"],
    } satisfies JsonSchema,
  },
  {
    name: "getProfessionalProfile",
    title: "Get RepWell professional profile",
    description:
      "Fetch open-tier public profile fields for one RepWell professional by ID.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          type: "string",
          description: "RepWell professional ID.",
          minLength: 1,
        },
      },
      required: ["id"],
    } satisfies JsonSchema,
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        data: professionalSummarySchema,
      },
      required: ["data"],
    } satisfies JsonSchema,
  },
  {
    name: "getProfessionalReviews",
    title: "Get RepWell professional reviews",
    description:
      "Fetch approved public review summaries for one RepWell professional by ID, capped at 10 reviews per page.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          type: "string",
          description: "RepWell professional ID.",
          minLength: 1,
        },
        page: {
          type: "number",
          description: "Page number, starting at 1.",
          minimum: 1,
          default: 1,
        },
        per_page: {
          type: "number",
          description: "Reviews per page, capped at 10.",
          minimum: 1,
          maximum: 10,
          default: 10,
        },
      },
      required: ["id"],
    } satisfies JsonSchema,
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        data: {
          type: "array",
          description: "Approved public review summaries.",
          items: reviewSummarySchema,
        },
        ...paginatedFields,
      },
      required: ["data", "total", "page", "per_page", "total_pages"],
    } satisfies JsonSchema,
  },
  {
    name: "getCompanyProfile",
    title: "Get RepWell company profile",
    description:
      "Fetch public company profile summary fields for one RepWell company by ID.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          type: "string",
          description: "RepWell company ID.",
          minLength: 1,
        },
      },
      required: ["id"],
    } satisfies JsonSchema,
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        data: companyProfileSchema,
      },
      required: ["data"],
    } satisfies JsonSchema,
  },
] as const;

export type WebMcpToolName = (typeof webMcpToolSchemas)[number]["name"];
