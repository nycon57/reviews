import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiPaginated,
  apiValidationError,
  apiInternalError,
  handleOptionsRequest,
  parsePaginationParams,
} from "@/lib/api/response";
import { createProofItem, listProofItems } from "@/lib/share-studio/service";

const createProofItemSchema = z
  .object({
    source: z
      .object({
        review_id: z.string().uuid().optional(),
        video_response_id: z.string().uuid().optional(),
        manual_json: z.record(z.unknown()).optional(),
      })
      .refine(
        (value) => {
          const count = [
            !!value.review_id,
            !!value.video_response_id,
            !!value.manual_json,
          ].filter(Boolean).length;
          return count === 1;
        },
        {
          message: "Exactly one source input is required",
        }
      ),
    template_id: z.string().uuid().optional(),
    title: z.string().max(200).optional(),
    summary: z.string().max(500).optional(),
    quote: z.string().max(2000).optional(),
    customer_name: z.string().max(200).optional(),
    rating: z.number().min(1).max(5).optional(),
  })
  .strict();

const filtersSchema = z.object({
  source_type: z.enum(["review", "video_testimonial", "manual_json"]).optional(),
  status: z
    .enum([
      "draft",
      "ready",
      "pending_approval",
      "approved",
      "rejected",
      "archived",
    ])
    .optional(),
  approval_status: z
    .enum(["approved", "pending_approval", "rejected"])
    .optional(),
  created_after: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
});

async function handleGet(request: NextRequest, context: ApiAuthContext) {
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePaginationParams(searchParams);

  const filterParse = filtersSchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!filterParse.success) {
    return apiValidationError(
      filterParse.error.errors.map((entry) => ({
        field: entry.path.join(".") || "query",
        message: entry.message,
      })),
      context.requestId
    );
  }

  try {
    const result = await listProofItems({
      organizationId: context.organizationId,
      ...filterParse.data,
      page,
      page_size: pageSize,
    });

    return apiPaginated(
      result.items,
      {
        page,
        pageSize,
        total: result.total,
      },
      context.requestId
    );
  } catch (error) {
    console.error("[share-studio] failed to list items", error);
    return apiInternalError(context.requestId, "Failed to list Share Studio items");
  }
}

async function handlePost(request: NextRequest, context: ApiAuthContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError(
      [{ field: "body", message: "Invalid JSON body" }],
      context.requestId
    );
  }

  const validation = createProofItemSchema.safeParse(body);
  if (!validation.success) {
    return apiValidationError(
      validation.error.errors.map((entry) => ({
        field: entry.path.join(".") || "body",
        message: entry.message,
      })),
      context.requestId
    );
  }

  try {
    const item = await createProofItem({
      organizationId: context.organizationId,
      source: validation.data.source,
      templateId: validation.data.template_id,
      title: validation.data.title,
      summary: validation.data.summary,
      quote: validation.data.quote,
      customer_name: validation.data.customer_name,
      rating: validation.data.rating,
    });

    return apiSuccess(item, context.requestId, 201);
  } catch (error) {
    console.error("[share-studio] failed to create item", error);
    return apiInternalError(
      context.requestId,
      "Failed to create Share Studio item"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const GET = withApiAuth(handleGet, ["share-studio:read"]);
export const POST = withApiAuth(handlePost, ["share-studio:write"]);
