"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LOReviewPreview } from "./preview/lo-review-preview";
import { CompanyReviewPreview } from "./preview/company-review-preview";
import { StarRatingBadgePreview } from "./preview/star-rating-badge-preview";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType } from "@/lib/widgets/types";
import { useState } from "react";

type ViewportSize = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<ViewportSize, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

// Sample data for preview when no real data is available
const SAMPLE_LO_PROFILE = {
  full_name: "Sarah Johnson",
  avatar_url: null,
  photo_url: null,
  nmls_id: "1234567",
  title: "Senior Loan Officer",
  average_rating: 4.8,
  total_reviews: 127,
  licensing_states: ["CA", "TX", "FL"],
};

const SAMPLE_ORG_PROFILE = {
  organization_name: "Horizon Mortgage Group",
  logo_url: null,
  average_rating: 4.6,
  total_reviews: 342,
  rating_distribution: { 5: 210, 4: 80, 3: 30, 2: 15, 1: 7 } as { 5: number; 4: number; 3: number; 2: number; 1: number },
  source_breakdown: [
    { source: "google", count: 180, average: 4.7 },
    { source: "zillow", count: 120, average: 4.5 },
    { source: "internal", count: 42, average: 4.8 },
  ],
};

const SAMPLE_BADGE_PROFILE = {
  organization_name: "Horizon Mortgage Group",
  full_name: null,
  average_rating: 4.8,
  total_reviews: 234,
};

const SAMPLE_REVIEWS = [
  {
    id: "1",
    reviewer_name: "Michael Chen",
    rating: 5,
    text: "Exceptional experience from start to finish. The entire team was professional, responsive, and made the process seamless. Highly recommend!",
    review_date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    source: "google",
    avatar_url: null,
    loan_type: "purchase",
    first_time_homebuyer: true,
  },
  {
    id: "2",
    reviewer_name: "Jennifer Williams",
    rating: 5,
    text: "Great communication throughout. Always answered my questions promptly and made sure I understood every step of the loan process.",
    review_date: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    source: "zillow",
    avatar_url: null,
    loan_type: "refinance",
    first_time_homebuyer: false,
  },
  {
    id: "3",
    reviewer_name: "Robert Davis",
    rating: 4,
    text: "Very knowledgeable and helpful. The closing process took a bit longer than expected, but the rate we got was excellent.",
    review_date: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    source: "internal",
    avatar_url: null,
    loan_type: "va",
    first_time_homebuyer: false,
  },
];

interface WidgetPreviewProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
}

function PreviewContent({ config, widgetType }: WidgetPreviewProps) {
  const colors = config.theme?.colors;
  const content = config.content;
  const maxWidth = config.theme?.layout?.maxWidth;
  const borderRadius = config.theme?.layout?.borderRadius;

  switch (widgetType) {
    case "lo_review":
    case "branch_review":
      return (
        <LOReviewPreview
          profile={SAMPLE_LO_PROFILE}
          reviews={SAMPLE_REVIEWS}
          content={content}
          colors={colors}
          maxWidth={maxWidth}
          borderRadius={borderRadius}
        />
      );

    case "company_review":
      return (
        <CompanyReviewPreview
          profile={SAMPLE_ORG_PROFILE}
          reviews={SAMPLE_REVIEWS}
          content={content}
          colors={colors}
          maxWidth={maxWidth}
          borderRadius={borderRadius}
        />
      );

    case "star_rating_badge":
    case "nps_score_badge":
      return (
        <StarRatingBadgePreview
          profile={SAMPLE_BADGE_PROFILE}
          colors={colors}
          borderRadius={borderRadius}
        />
      );

    case "review_carousel":
    case "review_wall":
      return (
        <CompanyReviewPreview
          profile={SAMPLE_ORG_PROFILE}
          reviews={SAMPLE_REVIEWS}
          content={{ ...content, columns: widgetType === "review_wall" ? 2 : 1 }}
          colors={colors}
          maxWidth={maxWidth}
          borderRadius={borderRadius}
        />
      );

    case "video_testimonial":
      return (
        <div
          className="rounded-lg border border-dashed border-gray-300 p-8 text-center"
          style={{
            background: colors?.background ?? "#ffffff",
            maxWidth: maxWidth ?? "100%",
          }}
        >
          <div className="text-gray-400 text-sm">
            Video testimonial preview will be available once video content is uploaded.
          </div>
        </div>
      );

    case "social_proof_banner":
      return (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            background: colors?.primary ?? "#52796f",
            maxWidth: maxWidth ?? "100%",
            borderRadius: borderRadius ?? "8px",
          }}
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="text-white text-sm">
            <span className="font-semibold">127 people</span> reviewed us this month
          </div>
        </div>
      );

    default:
      return (
        <div className="p-8 text-center text-gray-400 text-sm">
          Preview not available for this widget type.
        </div>
      );
  }
}

export function WidgetPreview({ config, widgetType }: WidgetPreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const width = VIEWPORT_WIDTHS[viewport];

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Viewport controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Preview
        </span>
        <ToggleGroup
          type="single"
          value={viewport}
          onValueChange={(v) => v && setViewport(v as ViewportSize)}
          className="gap-1"
        >
          <ToggleGroupItem value="desktop" size="sm" aria-label="Desktop preview">
            <Monitor size={14} />
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" size="sm" aria-label="Tablet preview">
            <Tablet size={14} />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" size="sm" aria-label="Mobile preview">
            <Smartphone size={14} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div
          className="transition-all duration-300 ease-out"
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            maxWidth: "100%",
          }}
        >
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <PreviewContent config={config} widgetType={widgetType} />
          </div>
        </div>
      </div>
    </div>
  );
}
