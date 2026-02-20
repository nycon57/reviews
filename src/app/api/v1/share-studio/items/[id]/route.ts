import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiValidationError,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import {
  applyProofApprovalAction,
  getProofItemWithDetails,
  patchProofItem,
} from "@/lib/share-studio/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const editSchema = z
  .object({
    title: z.string().max(200).nullable().optional(),
    summary: z.string().max(500).nullable().optional(),
    quote: z.string().max(2000).nullable().optional(),
    customer_name: z.string().max(200).nullable().optional(),
    rating: z.number().min(1).max(5).nullable().optional(),
    source_platform: z.string().max(100).nullable().optional(),
    source_review_date: z.string().datetime().nullable().optional(),
    custom_payload: z.record(z.unknown()).nullable().optional(),
  })
  .strict();

const approvalActionSchema = z
  .object({
    approval_action: z.enum(["approve", "reject", "request_changes"]),
    reason: z.string().max(400).optional(),
  })
  .strict();

async function handleGet(
  _request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;

  try {
    const details = await getProofItemWithDetails(context.organizationId, id);
    return apiSuccess(details, context.requestId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return apiNotFound("Share Studio item", context.requestId);
    }

    console.error("[share-studio] failed to fetch item", error);
    return apiInternalError(context.requestId, "Failed to fetch Share Studio item");
  }
}

async function handlePatch(
  request: NextRequest,
  context: ApiAuthContext,
  routeContext: RouteParams
) {
  const { id } = await routeContext.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError(
      [{ field: "body", message: "Invalid JSON body" }],
      context.requestId
    );
  }

  const approvalParse = approvalActionSchema.safeParse(body);
  if (approvalParse.success) {
    try {
      const item = await applyProofApprovalAction({
        organizationId: context.organizationId,
        itemId: id,
        actedBy: null,
        action: approvalParse.data.approval_action,
        reason: approvalParse.data.reason,
      });

      return apiSuccess(item, context.requestId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return apiNotFound("Share Studio item", context.requestId);
      }

      console.error("[share-studio] approval action failed", error);
      return apiInternalError(
        context.requestId,
        error instanceof Error ? error.message : "Failed approval action"
      );
    }
  }

  const editParse = editSchema.safeParse(body);
  if (!editParse.success) {
    return apiValidationError(
      editParse.error.errors.map((entry) => ({
        field: entry.path.join(".") || "body",
        message: entry.message,
      })),
      context.requestId
    );
  }

  try {
    const result = await patchProofItem({
      organizationId: context.organizationId,
      itemId: id,
      editedBy: null,
      content: editParse.data,
    });

    return apiSuccess(result, context.requestId);
  } catch (error) {
    if (error instanceof Error) {
      const blockedSignals = [
        "Protected source fields",
        "sentiment reversal",
        "Lexical delta exceeds",
      ];
      if (blockedSignals.some((signal) => error.message.includes(signal))) {
        return apiValidationError(
          [{ field: "content", message: error.message }],
          context.requestId
        );
      }
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return apiNotFound("Share Studio item", context.requestId);
    }

    console.error("[share-studio] edit failed", error);
    return apiInternalError(
      context.requestId,
      error instanceof Error ? error.message : "Failed to update Share Studio item"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const GET = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth((req, ctx) => handleGet(req, ctx, routeContext), ["share-studio:read"])(request);

export const PATCH = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth((req, ctx) => handlePatch(req, ctx, routeContext), ["share-studio:write"])(request);
