import type { FAQSection } from "./types";

/**
 * Schema.org FAQPage structured data type.
 * @see https://schema.org/FAQPage
 */
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
