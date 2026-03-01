import type { TemplateMetadata } from "./types";
import { TestimonialCard } from "./testimonial-card";
import { SpeechBubbleTemplate } from "./speech-bubble-template";
import { BoldSpotlight } from "./bold-spotlight";

/**
 * Template registry — maps template IDs to their metadata + components.
 *
 * These are "premium" SVG templates (Tier 2) as opposed to the existing
 * "simple" Satori templates (Tier 1: modern/minimal/bold).
 */
export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  "testimonial-card": {
    id: "testimonial-card",
    name: "Testimonial Card",
    description: "Clean, professional card with circular avatar and gradient header",
    category: "premium",
    supportedFormats: ["1:1", "9:16", "16:9"],
    component: TestimonialCard,
  },
  "speech-bubble": {
    id: "speech-bubble",
    name: "Speech Bubble",
    description: "Conversational design with speech bubble and brand gradient",
    category: "premium",
    supportedFormats: ["1:1", "9:16", "16:9"],
    component: SpeechBubbleTemplate,
  },
  "bold-spotlight": {
    id: "bold-spotlight",
    name: "Bold Spotlight",
    description: "High-impact split design with dark quote card",
    category: "premium",
    supportedFormats: ["1:1", "9:16", "16:9"],
    component: BoldSpotlight,
  },
};

/** All premium template IDs */
export const PREMIUM_TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY);

/** Check if a template ID is a premium SVG template */
export function isPremiumTemplate(templateId: string): boolean {
  return templateId in TEMPLATE_REGISTRY;
}

/** Get template metadata by ID, or null */
export function getTemplate(templateId: string): TemplateMetadata | null {
  return TEMPLATE_REGISTRY[templateId] ?? null;
}
