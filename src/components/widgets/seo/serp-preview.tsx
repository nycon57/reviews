"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Info } from "lucide-react";
import type { WidgetSeoData } from "@/lib/widgets/seo-actions";

interface SerpPreviewProps {
  data: WidgetSeoData;
}

/**
 * Simulated Google SERP preview showing how the rich snippet
 * would appear in search results based on the JSON-LD output.
 */
export function SerpPreview({ data }: SerpPreviewProps) {
  const { jsonLd } = data;

  const agg = jsonLd.aggregateRating;
  const ratingValue = agg ? parseFloat(agg.ratingValue) : null;
  const reviewCount = agg?.reviewCount ?? 0;

  const entityName = (jsonLd.name as string) || "Your Business Name";
  const entityUrl = (jsonLd.url as string) || "www.example.com";
  const schemaType = jsonLd["@type"] || "Organization";

  const displayUrl = useMemo(() => {
    try {
      const url = new URL(entityUrl);
      return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
    } catch {
      return entityUrl;
    }
  }, [entityUrl]);

  const description = useMemo(() => {
    const reviews = jsonLd.review;
    if (Array.isArray(reviews) && reviews.length > 0 && reviews[0].reviewBody) {
      return reviews[0].reviewBody;
    }
    if (jsonLd.jobTitle) {
      const worksFor = jsonLd.worksFor as { name?: string } | undefined;
      return `${entityName} - ${jsonLd.jobTitle as string}${worksFor?.name ? ` at ${worksFor.name}` : ""}`;
    }
    return `${entityName} has ${reviewCount} reviews with an average rating of ${ratingValue?.toFixed(1) ?? "N/A"} out of 5 stars.`;
  }, [jsonLd, entityName, reviewCount, ratingValue]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary">{schemaType}</Badge>
        {ratingValue !== null && (
          <Badge variant="outline">
            {ratingValue.toFixed(1)} stars / {reviewCount} reviews
          </Badge>
        )}
      </div>

      {/* Google-style SERP result card */}
      <Card className="border-border bg-white max-w-2xl">
        <CardContent className="p-6">
          <div className="space-y-1">
            {/* Favicon + breadcrumb */}
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                <span className="text-xs font-bold text-gray-600">
                  {entityName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-700">{displayUrl}</p>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl text-blue-800 hover:underline cursor-pointer font-normal leading-snug">
              {entityName}
              {schemaType !== "Person" ? " - Reviews & Ratings" : ""}
            </h3>

            {/* Star rating */}
            {ratingValue !== null && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-sm text-gray-700 font-medium">
                  {ratingValue.toFixed(1)}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.round(ratingValue)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({reviewCount.toLocaleString()})
                </span>
              </div>
            )}

            {/* Description snippet */}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 pt-0.5">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="flex items-start gap-2 px-1">
        <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Simulated preview. Actual appearance depends on Google&apos;s
          rendering and eligibility requirements.
        </p>
      </div>
    </div>
  );
}
