"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwitchField } from "./shared-fields";

interface SEOTabProps {
  enableStructuredData: boolean;
  structuredDataType: string;
  entityType: string;
  name: string;
  onStructuredDataChange: (enabled: boolean) => void;
  onStructuredDataTypeChange: (type: string) => void;
}

export function SEOTab({
  enableStructuredData,
  structuredDataType,
  entityType,
  name,
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: SEOTabProps) {
  return (
    <div className="space-y-4">
      <SwitchField
        label="Enable Structured Data"
        checked={enableStructuredData}
        onChange={onStructuredDataChange}
      />

      {enableStructuredData && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Schema Type</Label>
            <Select
              value={structuredDataType}
              onValueChange={onStructuredDataTypeChange}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LocalBusiness">Local Business</SelectItem>
                <SelectItem value="FinancialService">Financial Service</SelectItem>
                <SelectItem value="MortgageBroker">Mortgage Broker</SelectItem>
                <SelectItem value="Organization">Organization</SelectItem>
                <SelectItem value="Person">Person</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              JSON-LD structured data helps search engines display star ratings in results.
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
            <SeoJsonLdPreview
              schemaType={structuredDataType}
              entityType={entityType}
              name={name}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── JSON-LD syntax highlighting ─────────────────────────────────────────

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
        <span key={`t${i++}`} className="text-gray-500">
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
      <span key={`e${i++}`} className="text-gray-500">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

// ── JSON-LD preview component ───────────────────────────────────────────

function SeoJsonLdPreview({
  schemaType,
  entityType,
  name,
}: {
  schemaType: string;
  entityType: string;
  name: string;
}) {
  const preview = useMemo(() => {
    const resolvedType = schemaType === "MortgageBroker" ? "FinancialService" : schemaType;
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": resolvedType,
      name: name || "Your Widget Name",
    };

    if (entityType === "user" || schemaType === "Person") {
      schema.jobTitle = "Loan Officer";
      schema.worksFor = { "@type": "Organization", name: "Your Company" };
    }

    if (resolvedType === "LocalBusiness") {
      schema.address = {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Springfield",
        addressRegion: "IL",
        postalCode: "62701",
      };
      schema.telephone = "+1-555-555-5555";
    }

    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: 24,
      bestRating: "5",
      worstRating: "1",
    };

    schema.review = [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Jane D." },
        datePublished: new Date().toISOString().split("T")[0],
        reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
        reviewBody: "Excellent service...",
      },
    ];

    return JSON.stringify(schema, null, 2);
  }, [schemaType, entityType, name]);

  const highlighted = useMemo(() => highlightJson(preview), [preview]);

  return (
    <pre className="text-[10px] leading-relaxed bg-gray-950 border border-border rounded-md p-2.5 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre">
      {highlighted}
    </pre>
  );
}
