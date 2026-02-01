"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { FAQSection } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQSectionComponentProps {
  config: FAQSection;
  competitorName: string;
}

/**
 * Section 14: FAQ Accordion.
 *
 * Renders 8-12 FAQ questions in an accessible accordion. Combines standard
 * product questions with competitor-specific questions that mention the
 * competitor by name.
 *
 * Uses the ShadCN/Radix Accordion for built-in keyboard navigation
 * (Enter/Space to toggle, arrow keys between items) and ARIA attributes
 * (aria-expanded, aria-controls).
 *
 * FAQ answers support rich text via HTML. Content originates from
 * developer-authored static config objects (not user input), so
 * innerHTML rendering is used safely without a sanitizer.
 *
 * FAQPage JSON-LD structured data is handled separately by the schema
 * generator utility injected at the page level.
 */
export function FAQSectionComponent({
  config,
  competitorName,
}: FAQSectionComponentProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  const allFaqs = [...config.standard, ...config.competitorSpecific];

  if (allFaqs.length === 0) return null;

  return (
    <div ref={sectionRef}>
      {/* Section header */}
      <div className="mx-auto max-w-3xl text-center">
        <p
          className={cn(
            "font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 transition-all duration-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Common Questions
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 transition-all duration-500 md:text-4xl lg:text-5xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          Frequently Asked Questions
        </h2>

        <p
          className={cn(
            "mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 transition-all duration-500 md:text-xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        >
          Everything you need to know about switching from {competitorName} to
          RepWell.
        </p>
      </div>

      {/* Accordion */}
      <div
        className={cn(
          "mx-auto mt-12 max-w-3xl transition-all duration-500",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
        style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
      >
        <Accordion type="single" collapsible className="w-full">
          {allFaqs.map((faq, i) => (
            <AccordionItem
              key={`faq-${i}`}
              value={`faq-${i}`}
              className="border-b border-border"
            >
              <AccordionTrigger className="py-5 text-left font-sans text-base font-semibold text-repwell-teal-500 hover:no-underline hover:text-repwell-teal-400 [&[data-state=open]]:text-repwell-teal-300">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-0">
                <div
                  className="faq-answer font-sans text-sm leading-relaxed text-repwell-teal-400 [&_strong]:font-semibold [&_strong]:text-repwell-teal-500 [&_a]:text-repwell-teal-300 [&_a]:underline hover:[&_a]:text-repwell-teal-400 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p+p]:mt-2"
                  // Safe: FAQ answers come from static developer-authored config, not user input
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
