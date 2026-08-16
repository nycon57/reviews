/**
 * Boundary parsers for `survey_templates` rows.
 *
 * `questions`, `branding` and `thank_you_config` are `jsonb` columns, so the database gives back
 * `Json` and nothing more. Everything that reads a template — the dashboard actions and the public
 * survey page — goes through these functions to reach the typed survey contracts.
 */

import { z } from "zod";

import type { Json, Tables } from "@/types/database.types";
import type {
  Question,
  SurveyBranding,
  SurveyTemplate,
  ThankYouConfig,
} from "@/types/survey.types";

/**
 * Normalize a raw question row from the DB into the expected Question shape.
 * Handles legacy seed data that uses `question` instead of `title`,
 * `star_rating` instead of `rating`, and lacks `order`/`config`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuestion(raw: any, index: number): Question {
  const title = raw.title || raw.question || raw.text || "";
  const order = raw.order ?? index;
  const required = raw.required ?? true;
  const description = raw.description;
  const id = raw.id || `q-${index}`;

  // Normalize legacy type names
  let type: string = raw.type || "text";
  if (type === "star_rating") type = "rating";
  if (type === "single_choice") type = "multiple_choice";

  switch (type) {
    case "rating":
      return {
        id, type: "rating", title, description, required, order,
        config: raw.config ?? {
          maxRating: raw.scale?.max ?? 5,
          labels: { low: "Poor", high: "Excellent" },
        },
      };
    case "nps":
      return {
        id, type: "nps", title, description, required, order,
        config: raw.config ?? {
          labels: { detractor: "Not at all likely", passive: "Neutral", promoter: "Extremely likely" },
        },
      };
    case "multiple_choice":
      return {
        id, type: "multiple_choice", title, description, required, order,
        config: raw.config ?? {
          options: (raw.options || []).map((opt: string, i: number) => ({
            id: `opt-${i}`, label: opt, value: opt.toLowerCase().replace(/\s+/g, "_"),
          })),
          allowMultiple: type === "multiple_choice" && raw.type === "multiple_choice",
          allowOther: false,
        },
      };
    default: // text
      return {
        id, type: "text", title, description, required, order,
        config: raw.config ?? { multiline: true, placeholder: "Enter your response..." },
      };
  }
}

/** Normalize an array of raw question rows from the DB. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeQuestions(raw: any): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q, i) => normalizeQuestion(q, i));
}

/**
 * Tolerant reader for the persisted `branding` column. Every branding field is optional in the
 * contract, so an unreadable value drops out on its own instead of discarding the whole record;
 * a column that isn't an object at all yields no branding.
 */
const brandingRowSchema = z.object({
  logo: z.string().optional().catch(undefined),
  primaryColor: z.string().optional().catch(undefined),
  backgroundColor: z.string().optional().catch(undefined),
  fontFamily: z.string().optional().catch(undefined),
  showProgressBar: z.boolean().optional().catch(undefined),
  showQuestionNumbers: z.boolean().optional().catch(undefined),
});

/**
 * Tolerant reader for the persisted `thank_you_config` column. Legacy seed rows predate the
 * required `title`/`message` copy, so missing text becomes an empty string rather than dropping
 * the whole config — callers tell "configured" from "absent" by the record's presence.
 */
const thankYouConfigRowSchema = z.object({
  title: z.string().catch(""),
  message: z.string().catch(""),
  showSocialShare: z.boolean().optional().catch(undefined),
  redirectUrl: z.string().optional().catch(undefined),
  redirectDelay: z.number().optional().catch(undefined),
  showReviewRedirect: z.boolean().optional().catch(undefined),
  reviewRedirectRating: z.number().optional().catch(undefined),
});

/** Read the free-form `branding` column into the survey contract. */
export function normalizeBranding(raw: Json | null): SurveyBranding | undefined {
  const parsed = brandingRowSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** Read the `thank_you_config` column into the survey contract. */
export function normalizeThankYouConfig(raw: Json | null): ThankYouConfig | undefined {
  const parsed = thankYouConfigRowSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** Map a `survey_templates` row onto the domain `SurveyTemplate` contract. */
export function toSurveyTemplate(row: Tables<"survey_templates">): SurveyTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    questions: normalizeQuestions(row.questions),
    branding: normalizeBranding(row.branding),
    thankYouConfig: normalizeThankYouConfig(row.thank_you_config),
    isActive: row.is_active ?? true,
    isDefault: row.is_default ?? false,
  };
}
