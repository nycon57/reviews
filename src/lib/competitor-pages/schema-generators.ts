import type { CompetitorPageConfig, FAQSection } from "./types";
import { generateFAQPageSchema as generateGenericFAQPageSchema } from "@/lib/seo/schema-generators";

// ---------------------------------------------------------------------------
// FAQPage Schema
// ---------------------------------------------------------------------------

/** Strips HTML tags to produce plain-text for JSON-LD answer fields. */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Generates FAQPage JSON-LD structured data from a competitor page FAQ config.
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
const generateCompetitorFAQPageSchema = (faq: FAQSection) =>
  generateGenericFAQPageSchema(
    [...faq.standard, ...faq.competitorSpecific].map((item) => ({
      question: item.question,
      answer: stripHtmlTags(item.answer),
    }))
  );

export { generateCompetitorFAQPageSchema as generateFAQPageSchema };

/** Serializes FAQPage schema to a JSON-LD string for `<script type="application/ld+json">`. */
export function generateFAQPageJsonLd(faq: FAQSection): string {
  return JSON.stringify(generateCompetitorFAQPageSchema(faq));
}

// ---------------------------------------------------------------------------
// BreadcrumbList Schema
// ---------------------------------------------------------------------------

interface BreadcrumbListSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generates BreadcrumbList JSON-LD for a competitor comparison page.
 * Hierarchy: Home > Compare > [Competitor Name] Alternative
 */
export function generateBreadcrumbListSchema(
  config: CompetitorPageConfig,
  baseUrl: string,
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare",
        item: `${baseUrl}/compare`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${config.competitorName} Alternative`,
      },
    ],
  };
}
