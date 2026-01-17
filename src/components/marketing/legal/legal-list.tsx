"use client";

import * as React from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalListItem {
  /** Optional label/term for definition lists */
  label?: string;
  /** Content of the list item */
  content: React.ReactNode;
}

interface LegalListProps {
  /** List items */
  items: LegalListItem[];
  /** List variant */
  variant?: "bullet" | "check" | "definition" | "numbered";
  /** Additional className */
  className?: string;
}

export function LegalList({
  items = [],
  variant = "bullet",
  className,
}: LegalListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  if (variant === "definition") {
    return (
      <dl className={cn("space-y-4 my-6", className)}>
        {items.map((item, index) => (
          <div key={index} className="border-l-2 border-repwell-sage-200 pl-4">
            {item.label && (
              <dt className="font-semibold text-repwell-teal-500 mb-1">
                {item.label}
              </dt>
            )}
            <dd className="text-repwell-teal-400">{item.content}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (variant === "numbered") {
    return (
      <ol className={cn("space-y-3 my-6 list-decimal pl-6", className)}>
        {items.map((item, index) => (
          <li key={index} className="text-repwell-teal-400 pl-2">
            {item.label && (
              <strong className="text-repwell-teal-500">{item.label}: </strong>
            )}
            {item.content}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className={cn("space-y-3 my-6", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          {variant === "check" ? (
            <Check className="h-5 w-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="h-2 w-2 text-repwell-teal-300 flex-shrink-0 mt-2 fill-current" />
          )}
          <span className="text-repwell-teal-400">
            {item.label && (
              <strong className="text-repwell-teal-500">{item.label}: </strong>
            )}
            {item.content}
          </span>
        </li>
      ))}
    </ul>
  );
}
