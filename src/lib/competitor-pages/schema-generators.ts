import type { CompetitorPageConfig, FAQSection } from "./types";

// ---------------------------------------------------------------------------
// FAQPage Schema
// ---------------------------------------------------------------------------

interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/** Strips HTML tags to produce plain-text for JSON-LD answer fields. */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Generates FAQPage JSON-LD structured data from a competitor page FAQ config.
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
export function generateFAQPageSchema(faq: FAQSection): FAQPageSchema {
  const allFaqs = [...faq.standard, ...faq.competitorSpecific];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtmlTags(item.answer),
      },
    })),
  };
}

/** Serializes FAQPage schema to a JSON-LD string for `<script type="application/ld+json">`. */
export function generateFAQPageJsonLd(faq: FAQSection): string {
  return JSON.stringify(generateFAQPageSchema(faq));
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
