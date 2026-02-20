import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiValidationError,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import { createSmartLink } from "@/lib/share-studio/service";

const createLinkSchema = z
  .object({
    proof_item_id: z.string().uuid(),
    slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    destination_url: z.string().url().optional(),
  })
  .strict();

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

  const validation = createLinkSchema.safeParse(body);
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
    const link = await createSmartLink({
      organizationId: context.organizationId,
      proofItemId: validation.data.proof_item_id,
      slug: validation.data.slug,
      title: validation.data.title,
      description: validation.data.description,
      destinationUrl: validation.data.destination_url,
      createdBy: null,
    });

    return apiSuccess(link, context.requestId, 201);
  } catch (error) {
    console.error("[share-studio] failed to create smart link", error);
    return apiInternalError(
      context.requestId,
      "Failed to create Smart Link"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const POST = withApiAuth(handlePost, ["share-studio:publish"]);
