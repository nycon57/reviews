import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetEntityType, WidgetType } from "@/lib/widgets/types";

export interface EntityCtaDefaults {
  text: string;
  url: string;
}

const TRUNCATE_SUPPORTED_WIDGET_TYPES = new Set<WidgetType>([
  "review_profile",
  "lo_review",
  "branch_review",
  "company_review",
  "review_carousel",
  "review_wall",
  "social_proof_banner",
]);

export function supportsTruncateLength(widgetType: WidgetType): boolean {
  return TRUNCATE_SUPPORTED_WIDGET_TYPES.has(widgetType);
}

export function isCtaDefaultDriven(
  content: WidgetConfigJson["content"] | undefined,
  defaults: EntityCtaDefaults | null,
): boolean {
  const ctaText = content?.ctaText?.trim() ?? "";
  const ctaUrl = content?.ctaUrl?.trim() ?? "";

  if (!ctaText && !ctaUrl) return true;
  if (!defaults) return false;

  return ctaText === defaults.text && ctaUrl === defaults.url;
}

export function getDefaultCtaLabel(_entityType: WidgetEntityType): string {
  return "View Profile";
}
