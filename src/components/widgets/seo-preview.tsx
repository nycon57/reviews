"use client";

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

  return (
    <div className="rounded-lg border border-border bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-border">
        <span className="text-xs font-medium text-gray-600">
          JSON-LD Structured Data
        </span>
        <span className="text-[10px] text-gray-400 font-mono">
          application/ld+json
        </span>
      </div>
      <pre className="p-3 text-xs leading-relaxed font-mono text-gray-700 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
        {jsonLd}
      </pre>
    </div>
  );
}
