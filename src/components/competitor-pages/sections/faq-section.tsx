import type { FAQSection } from "@/lib/competitor-pages";

interface FAQSectionComponentProps {
  config: FAQSection;
  competitorName: string;
}

/**
 * Section 14: FAQ accordion.
 * Full implementation in S122.
 */
export function FAQSectionComponent({
  config,
  competitorName: _competitorName,
}: FAQSectionComponentProps) {
  const allFaqs = [...config.standard, ...config.competitorSpecific];

  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Frequently Asked Questions
      </h2>
      <div className="mx-auto mt-12 max-w-3xl space-y-6">
        {allFaqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-lg border border-border p-6"
          >
            <h3 className="font-semibold text-repwell-teal-500">
              {faq.question}
            </h3>
            <p className="mt-2 text-sm text-repwell-teal-400">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
