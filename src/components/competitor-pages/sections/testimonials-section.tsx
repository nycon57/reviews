import type { TestimonialCard } from "@/lib/competitor-pages";

interface TestimonialsSectionProps {
  testimonials: TestimonialCard[];
}

/**
 * Section 5: Customer testimonials.
 * Full implementation in S118.
 */
export function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        What Customers Say
      </h2>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.author}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <p className="text-repwell-teal-400 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-4">
              <p className="font-semibold text-repwell-teal-500">{t.author}</p>
              <p className="text-sm text-repwell-teal-300">
                {t.role}, {t.company}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
