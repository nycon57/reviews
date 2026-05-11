import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  LOReviewWidget,
  BranchReviewWidget,
  CompanyReviewWidget,
  ReviewCarousel,
  StarRatingBadge,
  VideoTestimonialWidget,
  ReviewWall,
  NPSScoreBadge,
  SocialProofBanner,
} from "../src";
import type { PublicWidgetConfig, PublicReview, NpsData, VideoTestimonial } from "../src/types";

// ── Test Fixtures ────────────────────────────────────────────────────

const mockReview: PublicReview = {
  id: "r1",
  reviewer_name: "Jane Doe",
  rating: 5,
  text: "Outstanding service! Highly recommended for anyone looking for a mortgage.",
  review_date: "2025-12-15",
  source: "google",
  avatar_url: null,
  loan_type: "Purchase",
  first_time_homebuyer: true,
};

const mockReview2: PublicReview = {
  id: "r2",
  reviewer_name: "John Smith",
  rating: 4,
  text: "Great experience overall.",
  review_date: "2025-11-20",
  source: "zillow",
  avatar_url: null,
  loan_type: "Refinance",
  first_time_homebuyer: false,
};

const mockReviews: PublicReview[] = [mockReview, mockReview2];

const baseConfig: PublicWidgetConfig = {
  widget_id: "test-widget",
  widget_type: "lo_review",
  entity_type: "user",
  entity_id: "user-123",
  name: "Test Widget",
  config: {
    content: {
      showHeader: true,
      headerText: "Customer Reviews",
      showCTA: false,
      showSource: true,
      showDate: true,
      showAvatar: true,
      showBranding: true,
    },
    theme: {
      colors: {
        starFilled: "#f59e0b",
        starEmpty: "#d1d5db",
      },
    },
  },
  enable_structured_data: false,
  structured_data_type: null,
  status: "active",
  version: 1,
  entity_profile: {
    full_name: "Alex Johnson",
    avatar_url: null,
    photo_url: "https://example.com/photo.jpg",
    nmls_id: "123456",
    title: "Senior Loan Officer",
    average_rating: 4.8,
    total_reviews: 150,
    licensing_states: ["CA", "TX"],
  },
};

const branchConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "branch_review",
  entity_type: "branch",
  entity_profile: {
    ...baseConfig.entity_profile!,
    organization_name: "Downtown Branch",
    logo_url: "https://example.com/logo.png",
    team_members: [
      {
        id: "tm1",
        full_name: "Team Member 1",
        photo_url: null,
        title: "LO",
        nmls_id: "654321",
        average_rating: 4.5,
        total_reviews: 50,
      },
    ],
  },
};

const companyConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "company_review",
  entity_type: "organization",
  entity_profile: {
    ...baseConfig.entity_profile!,
    organization_name: "Acme Mortgage",
    logo_url: "https://example.com/logo.png",
    rating_distribution: { 5: 100, 4: 30, 3: 10, 2: 5, 1: 3 },
    source_breakdown: [
      { source: "google", count: 80, average: 4.7 },
      { source: "zillow", count: 50, average: 4.5 },
    ],
  },
  config: {
    ...baseConfig.config,
    content: {
      ...baseConfig.config.content,
      showRatingDistribution: true,
      showSourceBreakdown: true,
    },
  },
};

const carouselConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "review_carousel",
  config: {
    ...baseConfig.config,
    carousel: {
      autoplay: false,
      showArrows: true,
      showDots: true,
      visibleCards: 1,
    },
  },
};

const starBadgeConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "star_rating_badge",
  config: {
    ...baseConfig.config,
    badge: {
      placement: "inline",
      showName: true,
    },
  },
};

const videoConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "video_testimonial",
  config: {
    ...baseConfig.config,
    video: {
      layout: "list",
      transcriptPosition: "below",
    },
  },
  video_testimonials: [
    {
      id: "v1",
      video_url: "https://example.com/video.mp4",
      poster_url: "https://example.com/poster.jpg",
      reviewer_name: "Video Reviewer",
      reviewer_title: "Homeowner",
      rating: 5,
      duration: 120,
      transcript: [{ start: 0, end: 5, text: "Great experience!" }],
    },
  ],
};

const wallConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "review_wall",
  config: {
    ...baseConfig.config,
    wall: {
      columns: 3,
      gap: 16,
      loadMore: "button",
    },
    content: {
      ...baseConfig.config.content,
      reviewsPerPage: 1,
    },
  },
};

const npsConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "nps_score_badge",
  config: {
    ...baseConfig.config,
    nps: {
      displayMode: "gauge",
      showBreakdown: true,
      showCount: true,
      showPeriod: true,
      labelText: "Net Promoter Score",
      periodText: "Last 12 months",
    },
  },
  nps_data: {
    score: 72,
    totalResponses: 500,
    promoterPct: 80,
    passivePct: 12,
    detractorPct: 8,
  },
};

const socialProofConfig: PublicWidgetConfig = {
  ...baseConfig,
  widget_type: "social_proof_banner",
  config: {
    ...baseConfig.config,
    socialProofBanner: {
      displayMode: "notification",
      placement: "bottom-right",
      dismissable: true,
    },
  },
};

// ── Tests ────────────────────────────────────────────────────────────

describe("LOReviewWidget", () => {
  it("renders with inline config and reviews", () => {
    render(<LOReviewWidget config={baseConfig} reviews={mockReviews} />);
    expect(screen.getByText("Alex Johnson")).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("NMLS# 123456")).toBeTruthy();
  });

  it("renders loading state when widgetId is provided without config", () => {
    render(<LOReviewWidget widgetId="test" />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("fires onEvent callback on impression", () => {
    const onEvent = vi.fn();
    render(<LOReviewWidget config={baseConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression", widgetId: "test-widget" }),
    );
  });

  it("renders empty state with no reviews", () => {
    render(<LOReviewWidget config={baseConfig} reviews={[]} />);
    expect(screen.getByText("No reviews yet.")).toBeTruthy();
  });

  it("applies custom className and style", () => {
    const { container } = render(
      <LOReviewWidget config={baseConfig} reviews={mockReviews} className="custom-class" style={{ maxWidth: 400 }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("custom-class")).toBe(true);
    expect(root.style.maxWidth).toBe("400px");
  });
});

describe("BranchReviewWidget", () => {
  it("renders branch profile with team members", () => {
    render(
      <BranchReviewWidget
        config={{ ...branchConfig, config: { ...branchConfig.config, content: { ...branchConfig.config.content, showTeam: true } } }}
        reviews={mockReviews}
      />,
    );
    expect(screen.getByText("Downtown Branch")).toBeTruthy();
    expect(screen.getByText("Our Team")).toBeTruthy();
    expect(screen.getByText("Team Member 1")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<BranchReviewWidget config={branchConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("CompanyReviewWidget", () => {
  it("renders company profile with rating distribution", () => {
    render(<CompanyReviewWidget config={companyConfig} reviews={mockReviews} />);
    expect(screen.getByText("Acme Mortgage")).toBeTruthy();
    // Rating distribution bars rendered
    expect(screen.getByText("100")).toBeTruthy(); // 5-star count
  });

  it("renders source breakdown", () => {
    render(<CompanyReviewWidget config={companyConfig} reviews={mockReviews} />);
    expect(screen.getByText("google")).toBeTruthy();
    expect(screen.getByText("zillow")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<CompanyReviewWidget config={companyConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("ReviewCarousel", () => {
  it("renders carousel with reviews and navigation", () => {
    render(<ReviewCarousel config={carouselConfig} reviews={mockReviews} />);
    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByLabelText("Previous reviews")).toBeTruthy();
    expect(screen.getByLabelText("Next reviews")).toBeTruthy();
  });

  it("navigates with arrow buttons", () => {
    const onEvent = vi.fn();
    render(<ReviewCarousel config={carouselConfig} reviews={mockReviews} onEvent={onEvent} />);
    fireEvent.click(screen.getByLabelText("Next reviews"));
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "carousel_navigate", metadata: { direction: "next" } }),
    );
  });

  it("renders dots", () => {
    render(<ReviewCarousel config={carouselConfig} reviews={mockReviews} />);
    const dots = screen.getAllByRole("tab");
    expect(dots.length).toBe(2);
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<ReviewCarousel config={carouselConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("StarRatingBadge", () => {
  it("renders rating and review count", () => {
    render(<StarRatingBadge config={starBadgeConfig} reviews={[]} />);
    expect(screen.getByText("4.8")).toBeTruthy();
    expect(screen.getByText("150 reviews")).toBeTruthy();
  });

  it("renders entity name when showName is true", () => {
    render(<StarRatingBadge config={starBadgeConfig} reviews={[]} />);
    expect(screen.getByText("Alex Johnson")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<StarRatingBadge config={starBadgeConfig} reviews={[]} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("VideoTestimonialWidget", () => {
  it("renders video testimonials", () => {
    render(<VideoTestimonialWidget config={videoConfig} reviews={[]} />);
    expect(screen.getByText("Video Reviewer")).toBeTruthy();
    expect(screen.getByText("Homeowner")).toBeTruthy();
  });

  it("renders transcript", () => {
    render(<VideoTestimonialWidget config={videoConfig} reviews={[]} />);
    expect(screen.getByText("Great experience!")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<VideoTestimonialWidget config={videoConfig} reviews={[]} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("ReviewWall", () => {
  it("renders reviews in grid layout", () => {
    render(<ReviewWall config={wallConfig} reviews={mockReviews} />);
    expect(screen.getByText("Jane Doe")).toBeTruthy();
  });

  it("shows load more button and loads more reviews on click", () => {
    render(<ReviewWall config={wallConfig} reviews={mockReviews} />);
    const loadMore = screen.getByText("Load More Reviews");
    expect(loadMore).toBeTruthy();
    fireEvent.click(loadMore);
    // After clicking, second review should now be visible
    expect(screen.getByText("John Smith")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<ReviewWall config={wallConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});

describe("NPSScoreBadge", () => {
  it("renders NPS score in gauge mode", () => {
    render(<NPSScoreBadge config={npsConfig} reviews={[]} />);
    expect(screen.getByText("+72")).toBeTruthy();
    expect(screen.getByText("Net Promoter Score")).toBeTruthy();
  });

  it("renders breakdown bar", () => {
    render(<NPSScoreBadge config={npsConfig} reviews={[]} />);
    expect(screen.getByText(/Promoters 80%/)).toBeTruthy();
    expect(screen.getByText(/Detractors 8%/)).toBeTruthy();
  });

  it("renders response count", () => {
    render(<NPSScoreBadge config={npsConfig} reviews={[]} />);
    expect(screen.getByText("Based on 500 responses")).toBeTruthy();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<NPSScoreBadge config={npsConfig} reviews={[]} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });

  it("renders in numeric mode", () => {
    const numericConfig = {
      ...npsConfig,
      config: {
        ...npsConfig.config,
        nps: { ...npsConfig.config.nps, displayMode: "numeric" as const },
      },
    };
    render(<NPSScoreBadge config={numericConfig} reviews={[]} />);
    expect(screen.getByText("+72")).toBeTruthy();
  });
});

describe("SocialProofBanner", () => {
  it("renders notification with review", () => {
    render(<SocialProofBanner config={socialProofConfig} reviews={mockReviews} />);
    expect(screen.getByText(/Jane Doe/)).toBeTruthy();
  });

  it("can be dismissed", () => {
    render(<SocialProofBanner config={socialProofConfig} reviews={mockReviews} />);
    const dismissBtn = screen.getByLabelText("Dismiss");
    fireEvent.click(dismissBtn);
    // After dismiss, notification should not be visible
    expect(screen.queryByText(/Jane Doe/)).toBeNull();
  });

  it("fires impression event", () => {
    const onEvent = vi.fn();
    render(<SocialProofBanner config={socialProofConfig} reviews={mockReviews} onEvent={onEvent} />);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "impression" }),
    );
  });
});
