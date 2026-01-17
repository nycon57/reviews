"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LegalSectionProps {
  /** Section ID for anchor linking */
  id: string;
  /** Section title */
  title: string;
  /** Whether this is a subsection (h3 instead of h2) */
  subsection?: boolean;
  /** Additional className */
  className?: string;
  /** Section content */
  children: React.ReactNode;
}

export function LegalSection({
  id,
  title,
  subsection = false,
  className,
  children,
}: LegalSectionProps) {
  const HeadingTag = subsection ? "h5" : "h4";

  return (
    <section
      id={id}
      className={cn(
        subsection ? "mt-8 mb-4" : "mt-12 mb-6 first:mt-0",
        className
      )}
    >
      <HeadingTag
        className={cn(
          "scroll-mt-28 mb-4",
          subsection
            ? "font-sans text-lg md:text-xl font-semibold text-repwell-teal-400"
            : "font-display text-2xl md:text-3xl font-bold text-repwell-teal-500"
        )}
      >
        {title}
      </HeadingTag>
      <div className="space-y-4 text-repwell-teal-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
