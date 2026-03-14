import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const WIDGET_ENTITY_COMPATIBILITY: Record<string, ReadonlySet<string>> = {
  review_profile: new Set(["user", "branch", "organization"]),
  lo_review: new Set(["user"]),
  branch_review: new Set(["branch"]),
  company_review: new Set(["organization"]),
  nps_score_badge: new Set(["organization"]),
  review_carousel: new Set(["user", "branch", "organization"]),
  review_wall: new Set(["user", "branch", "organization"]),
  star_rating_badge: new Set(["user", "branch", "organization"]),
  video_testimonial: new Set(["user", "branch", "organization"]),
  social_proof_banner: new Set(["user", "branch", "organization"]),
};

export interface PublicWidgetEntitySource {
  widget_type: string;
  entity_type: string;
  entity_id: string | null;
  organization_id: string;
}

export interface ResolvedWidgetEntityContext {
  entityType: "user" | "branch" | "organization";
  entityId: string | null;
  overrideApplied: boolean;
}

export class WidgetEntityOverrideError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "WidgetEntityOverrideError";
    this.status = status;
    this.code = code;
  }
}

function isSupportedEntityType(entityType: string): entityType is ResolvedWidgetEntityContext["entityType"] {
  return entityType === "user" || entityType === "branch" || entityType === "organization";
}

function assertSupportedEntityForWidget(widgetType: string, entityType: string): void {
  const allowedTypes = WIDGET_ENTITY_COMPATIBILITY[widgetType];
  if (!allowedTypes?.has(entityType)) {
    throw new WidgetEntityOverrideError(
      "Entity overrides are not supported for this widget type",
      400,
      "UNSUPPORTED_ENTITY_OVERRIDE",
    );
  }
}

async function userExistsInOrganization(organizationId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .or(`organization_id.eq.${organizationId},individual_organization_id.eq.${organizationId}`)
    .maybeSingle();

  return !error && !!data;
}

async function branchExistsInOrganization(organizationId: string, branchId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return !error && !!data;
}

export async function resolveWidgetEntityContext(
  widget: PublicWidgetEntitySource,
  searchParams: URLSearchParams,
): Promise<ResolvedWidgetEntityContext> {
  const rawEntityType = searchParams.get("entityType");
  const rawEntityId = searchParams.get("entityId");

  if (!rawEntityType && !rawEntityId) {
    if (!isSupportedEntityType(widget.entity_type)) {
      throw new WidgetEntityOverrideError(
        `Unexpected widget entity_type: ${widget.entity_type}`,
        500,
        "INVALID_WIDGET_ENTITY_TYPE",
      );
    }
    return {
      entityType: widget.entity_type,
      entityId: widget.entity_id,
      overrideApplied: false,
    };
  }

  if (!rawEntityType) {
    throw new WidgetEntityOverrideError(
      "entityType is required when using entity overrides",
      400,
      "INVALID_ENTITY_OVERRIDE",
    );
  }

  if (!isSupportedEntityType(rawEntityType)) {
    throw new WidgetEntityOverrideError(
      "entityType must be one of user, branch, or organization",
      400,
      "INVALID_ENTITY_OVERRIDE",
    );
  }

  assertSupportedEntityForWidget(widget.widget_type, rawEntityType);

  if (rawEntityType === "organization") {
    // If entityId is provided, validate it matches the widget's organization
    if (rawEntityId) {
      if (!UUID_PATTERN.test(rawEntityId)) {
        throw new WidgetEntityOverrideError(
          "entityId must be a valid UUID",
          400,
          "INVALID_ENTITY_OVERRIDE",
        );
      }
      if (rawEntityId !== widget.organization_id) {
        throw new WidgetEntityOverrideError(
          "Organization entity ID does not match the widget's organization",
          403,
          "ENTITY_OVERRIDE_FORBIDDEN",
        );
      }
    }

    return {
      entityType: "organization",
      entityId: null,
      overrideApplied: true,
    };
  }

  if (!rawEntityId) {
    throw new WidgetEntityOverrideError(
      `${rawEntityType} overrides require entityId`,
      400,
      "INVALID_ENTITY_OVERRIDE",
    );
  }

  if (!UUID_PATTERN.test(rawEntityId)) {
    throw new WidgetEntityOverrideError(
      "entityId must be a valid UUID",
      400,
      "INVALID_ENTITY_OVERRIDE",
    );
  }

  const exists = rawEntityType === "user"
    ? await userExistsInOrganization(widget.organization_id, rawEntityId)
    : await branchExistsInOrganization(widget.organization_id, rawEntityId);

  if (!exists) {
    throw new WidgetEntityOverrideError(
      "The requested entity override could not be found",
      404,
      "ENTITY_OVERRIDE_NOT_FOUND",
    );
  }

  return {
    entityType: rawEntityType,
    entityId: rawEntityId,
    overrideApplied: true,
  };
}
