import type { SocialProofCard } from "@/lib/competitor-pages";

interface SocialProofSectionProps {
  cards: SocialProofCard[];
}

/**
 * Section 15: Social proof wall.
 * Full implementation in S123.
 */
export function SocialProofSection({ cards }: SocialProofSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Social Proof
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={`${card.author}-${card.platform}`}
            className="rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-repwell-teal-400 italic">
              &ldquo;{card.quote}&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-repwell-teal-500">
                  {card.author}
                </p>
                <p className="text-xs text-repwell-teal-300">
                  {card.role}, {card.company}
                </p>
              </div>
              <span className="text-xs font-medium text-repwell-teal-300">
                {card.platform}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
