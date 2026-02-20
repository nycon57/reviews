import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiValidationError,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import { createRenderJob } from "@/lib/share-studio/service";

const createRenderJobSchema = z
  .object({
    proof_item_id: z.string().uuid(),
    asset_type: z.enum(["smart_link_og", "image", "video"]),
    template_id: z.string().uuid().optional(),
    template_version_id: z.string().uuid().optional(),
    priority: z.number().int().min(0).max(100).optional(),
    payload: z.record(z.unknown()).optional(),
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

  const validation = createRenderJobSchema.safeParse(body);
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
    const job = await createRenderJob({
      organizationId: context.organizationId,
      proofItemId: validation.data.proof_item_id,
      assetType: validation.data.asset_type,
      requestedBy: null,
      templateId: validation.data.template_id,
      templateVersionId: validation.data.template_version_id,
      priority: validation.data.priority,
      payload: validation.data.payload,
    });

    return apiSuccess(job, context.requestId, 201);
  } catch (error) {
    console.error("[share-studio] failed to create render job", error);
    return apiInternalError(
      context.requestId,
      "Failed to queue render job"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const POST = withApiAuth(handlePost, ["share-studio:render"]);
