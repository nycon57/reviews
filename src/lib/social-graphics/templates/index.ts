import type { Template, TemplateId, TemplateMetadata } from "../types";
import { fiveStarSpotlight } from "./five-star-spotlight";
import { monthlyRoundup } from "./monthly-roundup";
import { loSpotlight } from "./lo-spotlight";
import { milestoneTemplate } from "./milestone";
import { npsAnnouncement } from "./nps-announcement";
import { beforeAfter } from "./before-after";
import { teamExcellence } from "./team-excellence";
import { holidayThemed } from "./holiday-themed";

/** All available templates indexed by ID */
const TEMPLATE_MAP: Record<TemplateId, Template> = {
  "five-star-spotlight": fiveStarSpotlight,
  "monthly-roundup": monthlyRoundup,
  "lo-spotlight": loSpotlight,
  milestone: milestoneTemplate,
  "nps-announcement": npsAnnouncement,
  "before-after": beforeAfter,
  "team-excellence": teamExcellence,
  "holiday-themed": holidayThemed,
};

/** Get a template by ID, or undefined if not found */
export function getTemplate(id: TemplateId): Template | undefined {
  return TEMPLATE_MAP[id];
}

/** Get all templates */
export function getAllTemplates(): Template[] {
  return Object.values(TEMPLATE_MAP);
}

/** Get all template metadata (for listing without loading full functions) */
export function getAllTemplateMetadata(): TemplateMetadata[] {
  return Object.values(TEMPLATE_MAP).map((t) => t.metadata);
}

/** Select the best template for a given review rating and available data */
export function selectBestTemplate(params: {
  rating: number;
  hasLoanOfficer: boolean;
  reviewCount: number;
}): TemplateId {
  const { rating, hasLoanOfficer, reviewCount } = params;

  // 5-star single review → spotlight
  if (rating === 5 && reviewCount === 1) return "five-star-spotlight";

  // Has LO data → LO spotlight
  if (hasLoanOfficer && reviewCount === 1) return "lo-spotlight";

  // Multiple reviews → roundup or before-after
  if (reviewCount >= 4) return "monthly-roundup";
  if (reviewCount >= 2) return "before-after";

  // Default to spotlight
  return "five-star-spotlight";
}
