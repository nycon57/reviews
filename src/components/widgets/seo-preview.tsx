"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  generateStructuredData,
  resolveDefaultSchemaType,
  type EntityData,
  type ReviewData,
} from "@/lib/widgets/structured-data-generator";

// ── Types ────────────────────────────────────────────────────────────

interface SeoPreviewProps {
  /** Schema type override (e.g. "LocalBusiness", "Organization", "Person") */
  schemaType?: string | null;
  /** Entity type for default schema resolution */
  entityType: string;
  /** Entity display name */
  entityName: string;
  /** Entity job title (for Person schemas) */
  entityTitle?: string | null;
  /** Organization name (for Person.worksFor) */
  organizationName?: string | null;
  /** Logo URL */
  logoUrl?: string | null;
  /** Reviews data for aggregate rating and snippets */
  reviews?: ReviewData[];
}

/** Apply syntax highlighting to a JSON string. */
function highlightJson(json: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let i = 0;

  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t${i++}`} className="text-muted-foreground">
          {json.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      parts.push(
        <span key={`k${i++}`} className="text-indigo-600">{match[1]}</span>
      );
    } else if (match[2]) {
      parts.push(
        <span key={`s${i++}`} className="text-emerald-600">{match[2]}</span>
      );
    } else if (match[3]) {
      parts.push(
        <span key={`b${i++}`} className="text-amber-600">{match[3]}</span>
      );
    } else if (match[4]) {
      parts.push(
        <span key={`n${i++}`} className="text-blue-600">{match[4]}</span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    parts.push(
      <span key={`e${i++}`} className="text-muted-foreground">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

/**
 * Renders a syntax-highlighted preview of the JSON-LD structured data
 * that will be injected by the embed script.
 */
export function SeoPreview({
  schemaType,
  entityType,
  entityName,
  entityTitle,
  organizationName,
  logoUrl,
  reviews = [],
}: SeoPreviewProps) {
  const jsonLd = useMemo(() => {
    const resolvedType = schemaType ?? resolveDefaultSchemaType(entityType);

    const entity: EntityData = {
      name: entityName || "Your Entity Name",
      title: entityTitle,
      works_for: organizationName,
      logo_url: logoUrl,
    };

    const output = generateStructuredData(resolvedType, entity, reviews);
    return JSON.stringify(output, null, 2);
  }, [schemaType, entityType, entityName, entityTitle, organizationName, logoUrl, reviews]);

  const highlighted = useMemo(() => highlightJson(jsonLd), [jsonLd]);

  return (
    <div className="rounded-lg border border-border bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-300">
          JSON-LD Structured Data
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          application/ld+json
        </span>
      </div>
      <pre className="p-3 text-xs leading-relaxed font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
        {highlighted}
      </pre>
    </div>
  );
}
