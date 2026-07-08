import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiPaginated,
  apiValidationError,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
  parsePaginationParams,
  parseSortParams,
} from "@/lib/api/response";
import { findOrCreateContact } from "@/lib/contacts/actions";
import { normalizeEmail } from "@/lib/contacts/identity";

const contactSourceSchema = z.enum([
  "survey",
  "video_testimonial",
  "salesforce",
  "referral",
  "direct_review",
  "import",
  "manual",
]);

const createContactSchema = z
  .object({
    full_name: z.string().min(1).max(200).optional(),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    external_id: z.string().max(200).optional(),
    owner_user_id: z.string().uuid().nullable().optional(),
    source: contactSourceSchema.optional(),
  })
  .strict();

function mapContact(row: {
  id: string;
  organization_id: string;
  owner_user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    owner_user_id: row.owner_user_id,
    full_name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function handleGet(request: NextRequest, context: ApiAuthContext) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const { page, pageSize, offset } = parsePaginationParams(searchParams);
  const { sortBy, sortOrder } = parseSortParams(
    searchParams,
    ["created_at", "updated_at", "name", "email"],
    "created_at"
  );

  let query = supabase
    .from("contacts")
    .select(
      "id, organization_id, owner_user_id, name, email, phone, source, created_at, updated_at",
      { count: "exact" }
    )
    .eq("organization_id", context.organizationId)
    .is("erased_at", null)
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + pageSize - 1);

  const search = searchParams.get("search")?.trim();
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[contacts-api] failed to list contacts", error);
    return apiInternalError(context.requestId, "Failed to list contacts");
  }

  return apiPaginated(
    (data ?? []).map(mapContact),
    { page, pageSize, total: count ?? 0 },
    context.requestId
  );
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

  const validation = createContactSchema.safeParse(body);
  if (!validation.success) {
    return apiValidationError(
      validation.error.errors.map((entry) => ({
        field: entry.path.join(".") || "body",
        message: entry.message,
      })),
      context.requestId
    );
  }

  const input = validation.data;
  const email = normalizeEmail(input.email);
  if (!email) {
    return apiValidationError(
      [{ field: "email", message: "A valid email is required" }],
      context.requestId
    );
  }

  const supabase = createAdminClient();
  if (input.owner_user_id) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id")
      .eq("id", input.owner_user_id)
      .eq("organization_id", context.organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (ownerError) {
      console.error("[contacts-api] owner lookup failed", ownerError);
      return apiInternalError(context.requestId, "Failed to validate contact owner");
    }

    if (!owner) {
      return apiNotFound("Owner user", context.requestId);
    }
  }

  try {
    const result = await findOrCreateContact(
      context.organizationId,
      {
        email,
        name: input.full_name,
        phone: input.phone,
      },
      input.owner_user_id ?? null,
      input.source ?? "manual"
    );

    return apiSuccess(
      mapContact(result.contact),
      context.requestId,
      result.createdNew ? 201 : 200
    );
  } catch (error) {
    console.error("[contacts-api] failed to create contact", error);
    return apiInternalError(
      context.requestId,
      error instanceof Error ? error.message : "Failed to create contact"
    );
  }
}

export async function OPTIONS() {
  return handleOptionsRequest();
}

export const GET = withApiAuth(handleGet, ["contacts:read"]);
export const POST = withApiAuth(handlePost, ["contacts:write"]);
