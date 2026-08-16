"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProReviewPreview } from "./preview/pro-review-preview";
import { CompanyReviewPreview } from "./preview/company-review-preview";
import { BranchReviewPreview } from "./preview/branch-review-preview";
import { StarRatingBadgePreview } from "./preview/star-rating-badge-preview";
import { ReviewCarouselPreview } from "./preview/review-carousel-preview";
import { VideoTestimonialPreview } from "./preview/video-testimonial-preview";
import { ReviewWallPreview } from "./preview/review-wall-preview";
import { NpsScoreBadgePreview } from "./preview/nps-score-badge-preview";
import { SocialProofBannerPreview } from "./preview/social-proof-banner-preview";
import { type WidgetThemeLayout } from "./preview/layout";
import { Loader2 } from "lucide-react";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType, WidgetEntityType } from "@/lib/widgets/types";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  generateThemeStyleObject,
  getGoogleFontUrl,
  SHADOW_VALUES,
} from "@/lib/widgets/theme-utils";
import { getPreviewData, type PreviewData, type PreviewProfile, type PreviewReview } from "@/lib/widgets/actions";

type ViewportSize = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<ViewportSize, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 375,
};

// Sample data for preview when no real data is available
const SAMPLE_PRO_PROFILE = {
  full_name: "Sarah Johnson",
  avatar_url: null,
  photo_url: null,
  nmls_id: "1234567",
  title: "Senior Professional",
  average_rating: 4.8,
  total_reviews: 127,
  licensing_states: ["CA", "TX", "FL"],
};

const SAMPLE_ORG_PROFILE = {
  organization_name: "Horizon Mortgage Group",
  logo_url: null,
  primary_color: null as string | null,
  average_rating: 4.6,
  total_reviews: 342,
  rating_distribution: { 5: 210, 4: 80, 3: 30, 2: 15, 1: 7 } as { 5: number; 4: number; 3: number; 2: number; 1: number },
  source_breakdown: [
    { source: "google", count: 180, average: 4.7 },
    { source: "zillow", count: 120, average: 4.5 },
    { source: "internal", count: 42, average: 4.8 },
  ],
};

const SAMPLE_BRANCH_PROFILE = {
  organization_name: "Horizon Mortgage - Downtown",
  logo_url: null,
  photo_url: null,
  nmls_id: "9876543",
  average_rating: 4.7,
  total_reviews: 89,
  rating_distribution: { 5: 52, 4: 22, 3: 10, 2: 3, 1: 2 } as { 5: number; 4: number; 3: number; 2: number; 1: number },
  source_breakdown: [
    { source: "google", count: 45, average: 4.8 },
    { source: "zillow", count: 30, average: 4.6 },
    { source: "internal", count: 14, average: 4.9 },
  ],
  address: { street: "123 Main Street", city: "Austin", state: "TX", zip: "78701" },
  telephone: "+15125551234",
  team_members: [
    { id: "t1", full_name: "Sarah Johnson", photo_url: null, title: "Senior Professional", nmls_id: "1234567", average_rating: 4.9, total_reviews: 45 },
    { id: "t2", full_name: "Mike Thompson", photo_url: null, title: "Professional", nmls_id: "2345678", average_rating: 4.6, total_reviews: 28 },
    { id: "t3", full_name: "Lisa Chen", photo_url: null, title: "Professional", nmls_id: "3456789", average_rating: 4.8, total_reviews: 16 },
  ],
};

const SAMPLE_BADGE_PROFILE = {
  organization_name: "Horizon Mortgage Group",
  full_name: null,
  average_rating: 4.8,
  total_reviews: 234,
};

const SAMPLE_VIDEO_TESTIMONIALS = [
  {
    id: "vt1",
    video_url: "",
    poster_url: null,
    reviewer_name: "Amanda Torres",
    reviewer_title: "New Customer",
    rating: 5,
    duration: 92,
    transcript: [
      { start: 0, end: 5, text: "I was nervous about getting started." },
      { start: 5, end: 12, text: "Sarah made the whole process feel manageable and stress-free." },
      { start: 12, end: 20, text: "She explained every step clearly and was always available to answer questions." },
      { start: 20, end: 28, text: "I honestly could not have done it without her guidance." },
    ],
  },
  {
    id: "vt2",
    video_url: "",
    poster_url: null,
    reviewer_name: "David Kim",
    reviewer_title: "Repeat Customer",
    rating: 5,
    duration: 68,
    transcript: [
      { start: 0, end: 6, text: "We came back for a second project because the first experience was excellent." },
      { start: 6, end: 14, text: "The team was incredibly responsive and professional throughout." },
      { start: 14, end: 22, text: "I would absolutely recommend them to anyone looking for a reliable partner." },
    ],
  },
];

const SAMPLE_REVIEWS_EN: { id: string; reviewer_name: string; rating: number; text: string; review_date: string; source: string; avatar_url: string | null; featured: boolean; loan_type: string; first_time_homebuyer: boolean }[] = [
  {
    id: "1",
    reviewer_name: "Michael Chen",
    rating: 5,
    text: "Exceptional experience from start to finish. The entire team was professional, responsive, and made the process seamless. Highly recommend!",
    review_date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    source: "google",
    avatar_url: null,
    featured: true,
    loan_type: "purchase",
    first_time_homebuyer: true,
  },
  {
    id: "2",
    reviewer_name: "Jennifer Williams",
    rating: 5,
    text: "Great communication throughout. Always answered my questions promptly and made sure I understood every step.",
    review_date: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    source: "zillow",
    avatar_url: null,
    featured: false,
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
    featured: false,
    loan_type: "va",
    first_time_homebuyer: false,
  },
];

const SAMPLE_REVIEWS_ES: typeof SAMPLE_REVIEWS_EN = [
  {
    id: "1",
    reviewer_name: "Miguel Torres",
    rating: 5,
    text: "Experiencia excepcional de principio a fin. Todo el equipo fue profesional, receptivo e hizo que el proceso fuera impecable. \u00a1Muy recomendable!",
    review_date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    source: "google",
    avatar_url: null,
    featured: true,
    loan_type: "purchase",
    first_time_homebuyer: true,
  },
  {
    id: "2",
    reviewer_name: "Ana Garc\u00eda",
    rating: 5,
    text: "Excelente comunicaci\u00f3n en todo momento. Siempre respondieron mis preguntas r\u00e1pidamente y se aseguraron de que entendiera cada paso del proceso.",
    review_date: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    source: "zillow",
    avatar_url: null,
    featured: false,
    loan_type: "refinance",
    first_time_homebuyer: false,
  },
  {
    id: "3",
    reviewer_name: "Carlos Rodr\u00edguez",
    rating: 4,
    text: "Muy conocedores y serviciales. El proceso de cierre tard\u00f3 un poco m\u00e1s de lo esperado, pero la tasa que obtuvimos fue excelente.",
    review_date: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    source: "internal",
    avatar_url: null,
    featured: false,
    loan_type: "va",
    first_time_homebuyer: false,
  },
];

interface WidgetPreviewProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  entityType?: WidgetEntityType;
  entityId?: string | null;
}

function PreviewContent({ config, widgetType, entityType, entityId }: WidgetPreviewProps) {
  const colors = config.theme?.colors;
  const content = config.content;
  const borderRadius = config.theme?.layout?.borderRadius;
  const layout = config.theme?.layout as WidgetThemeLayout | undefined;
  const lang = content?.language ?? "en";

  // Fetch real data when entity is selected
  const [liveData, setLiveData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!entityType) {
      setLiveData(null);
      setFetchError(null);
      return;
    }

    if (entityType !== "organization" && !entityId) {
      setLiveData(null);
      setFetchError(null);
      return;
    }
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setFetchError(null);
    const result = await getPreviewData(entityType, entityId ?? null, config.filters, lang);
    if (id !== fetchIdRef.current) return; // stale response
    if (result.success) {
      setLiveData(result.data);
    } else {
      setLiveData(null);
      setFetchError(result.error ?? "Failed to load preview data");
    }
    setIsLoading(false);
  }, [config.filters, entityType, entityId, lang]);

  useEffect(() => {
    if (fetchRef.current) clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(fetchData, 300);
    return () => {
      if (fetchRef.current) clearTimeout(fetchRef.current);
    };
  }, [fetchData]);

  // Use real data if available, otherwise sample data
  const profileData: PreviewProfile | null = liveData?.profile ?? null;

  const proProfile = profileData
    ? {
        full_name: profileData.full_name ?? null,
        avatar_url: profileData.avatar_url ?? null,
        photo_url: profileData.photo_url ?? null,
        nmls_id: profileData.nmls_id ?? null,
        title: profileData.title ?? null,
        average_rating: profileData.average_rating ?? 0,
        total_reviews: profileData.total_reviews ?? 0,
        licensing_states: profileData.licensing_states ?? null,
      }
    : SAMPLE_PRO_PROFILE;

  const orgProfile = profileData
    ? {
        ...SAMPLE_ORG_PROFILE,
        organization_name: profileData.organization_name ?? profileData.full_name ?? SAMPLE_ORG_PROFILE.organization_name,
        logo_url: profileData.logo_url ?? null,
        primary_color: profileData.primary_color ?? null,
        average_rating: profileData.average_rating ?? SAMPLE_ORG_PROFILE.average_rating,
        total_reviews: profileData.total_reviews ?? SAMPLE_ORG_PROFILE.total_reviews,
      }
    : SAMPLE_ORG_PROFILE;

  const branchProfile = profileData
    ? {
        ...SAMPLE_BRANCH_PROFILE,
        organization_name: profileData.organization_name ?? profileData.full_name ?? SAMPLE_BRANCH_PROFILE.organization_name,
        logo_url: profileData.logo_url ?? null,
        photo_url: profileData.photo_url ?? null,
        average_rating: profileData.average_rating ?? SAMPLE_BRANCH_PROFILE.average_rating,
        total_reviews: profileData.total_reviews ?? SAMPLE_BRANCH_PROFILE.total_reviews,
      }
    : SAMPLE_BRANCH_PROFILE;

  const badgeProfile = profileData
    ? {
        organization_name: profileData.organization_name ?? profileData.full_name ?? "Preview",
        full_name: profileData.full_name ?? null,
        average_rating: profileData.average_rating ?? 4.8,
        total_reviews: profileData.total_reviews ?? 0,
      }
    : SAMPLE_BADGE_PROFILE;

  const sampleReviews = lang === "es" ? SAMPLE_REVIEWS_ES : SAMPLE_REVIEWS_EN;

  // Determine if we expect real data (entity is selected or org type which auto-resolves)
  const expectsRealData = entityType === "organization" || !!entityId;

  type ReviewItem = {
    id: string;
    reviewer_name: string;
    rating: number;
    text: string;
    review_date: string;
    source: string;
    avatar_url: string | null;
    featured: boolean;
    loan_type: string;
    first_time_homebuyer: boolean;
  };

  // Reviews come pre-translated from getPreviewData when language !== "en"
  const reviews: ReviewItem[] = liveData?.reviews?.length
    ? liveData.reviews.map((r: PreviewReview) => ({
        id: r.id,
        reviewer_name: r.reviewer_name ?? "Anonymous",
        rating: r.rating,
        text: r.text ?? "",
        review_date: r.review_date,
        source: r.source,
        avatar_url: r.avatar_url ?? null,
        featured: r.featured ?? false,
        loan_type: r.loan_type ?? "purchase",
        first_time_homebuyer: r.first_time_homebuyer ?? false,
      }))
    : expectsRealData && liveData
      ? [] // Real data loaded but empty — show the "no reviews" state, not samples
      : sampleReviews;

  const reviewPreviewKey = `${lang}:${
    config.filters?.sortOrder ?? "newest"
  }:${reviews.map((review) => review.id).join(",")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading preview data...</span>
      </div>
    );
  }

  // When no entity is selected yet (user/branch templates), fall through to the
  // sample-data preview so the builder shows representative review cards instead
  // of a blank/spinner state — consistent with the badge/banner previews.

  // Show error state when fetch failed
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <p className="text-sm font-medium text-destructive mb-1">Preview unavailable</p>
        <p className="text-xs text-muted-foreground">{fetchError}</p>
      </div>
    );
  }

  // Show empty state when real data loaded but no reviews found
  if (expectsRealData && liveData && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">No reviews found</p>
        <p className="text-xs text-muted-foreground">
          No published reviews match the current filters for this {entityType === "organization" ? "organization" : entityType === "branch" ? "branch" : "professional"}.
        </p>
      </div>
    );
  }

  // For entity-specific review templates, adapt preview to selected entity type
  const reviewPreviewByEntity = () => {
    if (entityType === "branch") {
      return (
        <BranchReviewPreview
          key={reviewPreviewKey}
          profile={branchProfile}
          reviews={reviews}
          content={content}
          colors={colors}
          initialSort={config.filters?.sortOrder}
          layout={layout}
        />
      );
    }
    if (entityType === "organization") {
      return (
        <CompanyReviewPreview
          key={reviewPreviewKey}
          profile={orgProfile}
          reviews={reviews}
          content={content}
          colors={colors}
          initialSort={config.filters?.sortOrder}
          layout={layout}
        />
      );
    }
    return (
      <ProReviewPreview
        profile={proProfile}
        reviews={reviews}
        content={content}
        colors={colors}
        layout={layout}
      />
    );
  };

  switch (widgetType) {
    case "review_profile":
    case "lo_review":
    case "branch_review":
    case "company_review":
      return reviewPreviewByEntity();

    case "star_rating_badge":
      return (
        <StarRatingBadgePreview
          profile={badgeProfile}
          colors={colors}
          borderRadius={borderRadius}
          layout={layout}
          language={lang}
          profileUrl={liveData?.profileUrl ?? undefined}
        />
      );

    case "nps_score_badge":
      return (
        <NpsScoreBadgePreview
          nps={config.nps}
          colors={colors}
          borderRadius={borderRadius}
          layout={layout}
          language={lang}
        />
      );

    case "review_carousel":
      return (
        <ReviewCarouselPreview
          key={reviewPreviewKey}
          reviews={reviews}
          content={content}
          colors={colors}
          carousel={config.carousel}
          layout={layout}
        />
      );

    case "review_wall":
      return (
        <ReviewWallPreview
          key={reviewPreviewKey}
          reviews={reviews}
          content={content}
          colors={colors}
          wall={config.wall}
          filters={config.filters}
          layout={layout}
        />
      );

    case "video_testimonial":
      return (
        <VideoTestimonialPreview
          key={lang}
          profile={proProfile}
          testimonials={SAMPLE_VIDEO_TESTIMONIALS}
          content={content}
          video={config.video}
          colors={colors}
          layout={layout}
        />
      );

    case "social_proof_banner":
      return (
        <SocialProofBannerPreview
          key={lang}
          profile={{
            average_rating: badgeProfile.average_rating,
            total_reviews: badgeProfile.total_reviews,
            organization_name:
              badgeProfile.organization_name ??
              badgeProfile.full_name ??
              "Preview",
          }}
          socialProofBanner={{
            ctaText: content?.ctaText,
            ctaUrl: content?.ctaUrl,
          }}
          content={content}
          colors={colors}
          layout={layout}
        />
      );

    default:
      return (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Preview not available for this widget type.
        </div>
      );
  }
}

/** Hook to load Google Fonts dynamically when a non-system font is selected */
function useGoogleFont(fontFamily: string | undefined) {
  const linkRef = useRef<Element | null>(null);

  useEffect(() => {
    // Clean up previous link
    if (linkRef.current) {
      linkRef.current.remove();
      linkRef.current = null;
    }

    if (!fontFamily) return;
    const url = getGoogleFontUrl(fontFamily);
    if (!url) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
    linkRef.current = link;

    return () => {
      if (linkRef.current) {
        linkRef.current.remove();
        linkRef.current = null;
      }
    };
  }, [fontFamily]);
}

export function WidgetPreview({ config, widgetType, entityType, entityId }: WidgetPreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const width = VIEWPORT_WIDTHS[viewport];

  // Load Google Font if needed
  useGoogleFont(config.theme?.typography?.fontFamily);

  // Generate CSS custom properties for the preview container
  const themeStyle = generateThemeStyleObject(
    config.theme?.colors as Record<string, string>,
    config.theme?.typography as Record<string, string>,
    config.theme?.layout as Record<string, string>,
  );

  const shadow = config.theme?.layout?.shadow;
  const shadowValue = shadow ? (SHADOW_VALUES[shadow] ?? "none") : "0 1px 2px 0 rgba(0,0,0,0.05)";

  return (
    <div className="h-full flex flex-col bg-muted/50">
      {/* Viewport controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
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
          <style>{`
            .rw-preview-scope .bg-white { background: var(--rw-surface, var(--rw-bg, #ffffff)) !important; }
            .rw-preview-scope .bg-gray-50,
            .rw-preview-scope .bg-gray-100 { background: var(--rw-surface-muted, #f9fafb) !important; }
            .rw-preview-scope .bg-gray-200 { background: var(--rw-surface-strong, #e5e7eb) !important; }
            .rw-preview-scope .border-gray-100,
            .rw-preview-scope .border-gray-200,
            .rw-preview-scope .border-gray-300 { border-color: var(--rw-border, #e5e7eb) !important; }
            .rw-preview-scope .text-gray-700,
            .rw-preview-scope .text-gray-600 { color: var(--rw-text, #1a1a2e) !important; }
            .rw-preview-scope .text-gray-500 { color: var(--rw-text-muted, #6b7280) !important; }
            .rw-preview-scope .text-gray-400,
            .rw-preview-scope .text-gray-300 { color: var(--rw-text-subtle, #9ca3af) !important; }
          `}</style>
          <div
            className="rw-preview-scope rounded-lg border overflow-hidden"
            style={{
              ...themeStyle,
              background: config.theme?.colors?.background ?? "#ffffff",
              borderColor: config.theme?.colors?.border ?? "#e5e7eb",
              boxShadow: shadowValue,
              borderRadius: config.theme?.layout?.borderRadius ?? "8px",
              fontFamily: config.theme?.typography?.fontFamily ?? "system-ui",
            }}
          >
            <PreviewContent config={config} widgetType={widgetType} entityType={entityType} entityId={entityId} />
          </div>
        </div>
      </div>
    </div>
  );
}
