import type { FAQSection, CompetitorPageConfig } from "./types";

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

/**
 * Strips HTML tags from a string to produce plain-text for JSON-LD.
 * JSON-LD answer text should be plain or lightly formatted — Google
 * tolerates some HTML but plain text is safest.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Generates FAQPage JSON-LD structured data from a competitor page config.
 *
 * Combines standard and competitor-specific FAQ items into a single
 * schema.org FAQPage entity. This should be injected as a
 * `<script type="application/ld+json">` tag in the page head.
 *
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

/**
 * Returns the JSON-LD string for a FAQPage, ready to be injected
 * into a `<script type="application/ld+json">` tag.
 */
export function generateFAQPageJsonLd(faq: FAQSection): string {
  return JSON.stringify(generateFAQPageSchema(faq));
}
