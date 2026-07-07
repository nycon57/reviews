// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  PublicWidgetConfig,
  VideoTestimonial,
  EntityProfile,
} from "../types";

// ── Test data ──────────────────────────────────────────────────────

const mockProfile: EntityProfile = {
  full_name: "Jane Miller",
  avatar_url: null,
  photo_url: "https://example.com/jane.jpg",
  nmls_id: "123456",
  title: "Senior Loan Officer",
  average_rating: 4.8,
  total_reviews: 42,
  licensing_states: ["CA", "TX"],
};

const mockTestimonials: VideoTestimonial[] = [
  {
    id: "vt-1",
    video_url: "https://example.com/video1.mp4",
    poster_url: "https://example.com/poster1.jpg",
    reviewer_name: "John Doe",
    reviewer_title: "Home Buyer",
    rating: 5,
    duration: 120,
    transcript: [
      { start: 0, end: 5, text: "This was a great experience." },
      { start: 5, end: 10, text: "I highly recommend Jane." },
    ],
  },
  {
    id: "vt-2",
    video_url: "https://example.com/video2.mp4",
    poster_url: null,
    reviewer_name: "Sarah Connor",
    reviewer_title: null,
    rating: 4,
    duration: 90,
    transcript: null,
  },
];

function makeConfig(overrides?: Partial<PublicWidgetConfig>): PublicWidgetConfig {
  return {
    widget_id: "vt-widget-1",
    widget_type: "video_testimonial",
    entity_type: "user",
    entity_id: "user-1",
    name: "Video Testimonials",
    config: {
      content: {
        showHeader: true,
        showBranding: true,
        showDisclaimer: true,
        disclaimerText: "Equal Housing Lender.",
      },
      theme: {
        colors: {
          primary: "#52796f",
          starFilled: "#f59e0b",
          starEmpty: "#d1d5db",
        },
      },
      video: {
        transcriptPosition: "below",
        layout: "list",
      },
    },
    enable_structured_data: false,
    structured_data_type: null,
    status: "active",
    version: 1,
    entity_profile: mockProfile,
    video_testimonials: mockTestimonials,
    ...overrides,
  };
}

// ── Video Testimonial Widget tests ──────────────────────────────────

describe("Video Testimonial Widget", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders video items for each testimonial", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const items = dom.querySelectorAll(".rw-vt__item");
    expect(items).toHaveLength(2);
  });

  it("renders poster image when provided", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const poster = dom.querySelector(".rw-vt__poster") as HTMLImageElement;
    expect(poster).not.toBeNull();
    expect(poster.src).toBe("https://example.com/poster1.jpg");
    expect(poster.loading).toBe("lazy");
  });

  it("renders poster placeholder when no poster URL", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const placeholders = dom.querySelectorAll(".rw-vt__poster-placeholder");
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0].textContent).toBe("Video Testimonial");
  });

  it("renders play button overlay with accessible attributes", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const playBtns = dom.querySelectorAll(".rw-vt__play-btn");
    expect(playBtns).toHaveLength(2);
    expect(playBtns[0].getAttribute("role")).toBe("button");
    expect(playBtns[0].getAttribute("aria-label")).toBe("Play video");
    expect(playBtns[0].getAttribute("tabindex")).toBe("0");
  });

  it("renders reviewer name and title", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const names = dom.querySelectorAll(".rw-vt__reviewer-name");
    expect(names[0].textContent).toBe("John Doe");

    const titles = dom.querySelectorAll(".rw-vt__reviewer-title");
    expect(titles[0].textContent).toBe("Home Buyer");
  });

  it("renders star ratings", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const starContainers = dom.querySelectorAll(".rw-vt__stars");
    expect(starContainers).toHaveLength(2);
    expect(starContainers[0].getAttribute("role")).toBe("img");
    expect(starContainers[0].getAttribute("aria-label")).toBe("5 out of 5 stars");
  });

  it("renders LO section with profile info", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const loSection = dom.querySelector(".rw-vt__lo");
    expect(loSection).not.toBeNull();

    const loName = dom.querySelector(".rw-vt__lo-name");
    expect(loName?.textContent).toBe("Jane Miller");

    const loNmls = dom.querySelector(".rw-vt__lo-nmls a") as HTMLAnchorElement;
    expect(loNmls.textContent).toBe("123456");
    expect(loNmls.href).toContain("nmlsconsumeraccess.org");
  });

  it("renders LO photo when available", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const loPhoto = dom.querySelector(".rw-vt__lo-photo") as HTMLImageElement;
    expect(loPhoto).not.toBeNull();
    expect(loPhoto.src).toBe("https://example.com/jane.jpg");
  });

  it("renders LO initials when no photo", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig({
      entity_profile: { ...mockProfile, photo_url: null, avatar_url: null },
    });
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    const placeholder = dom.querySelector(".rw-vt__lo-photo-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("JM");
  });

  it("renders transcript segments when position is below", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const transcript = dom.querySelector(".rw-vt__transcript");
    expect(transcript).not.toBeNull();
    expect(transcript?.getAttribute("role")).toBe("region");
    expect(transcript?.getAttribute("aria-label")).toBe("Video transcript");

    const segs = dom.querySelectorAll(".rw-vt__transcript-seg");
    expect(segs).toHaveLength(2);
    expect(segs[0].textContent).toBe("This was a great experience.");
    expect(segs[1].textContent).toBe("I highly recommend Jane.");
  });

  it("hides transcript when position is hidden", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig();
    config.config.video = { transcriptPosition: "hidden", layout: "list" };
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    expect(dom.querySelector(".rw-vt__transcript")).toBeNull();
  });

  it("renders side layout when transcript position is side", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig();
    config.config.video = { transcriptPosition: "side", layout: "list" };
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    const sideItems = dom.querySelectorAll(".rw-vt__item--side");
    // Only the first testimonial has transcript, so only it gets side layout
    expect(sideItems).toHaveLength(1);

    const sidePanel = dom.querySelector(".rw-vt__side-panel");
    expect(sidePanel).not.toBeNull();
  });

  it("renders grid layout when configured", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig();
    config.config.video = { layout: "grid", transcriptPosition: "below" };
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    expect(dom.querySelector(".rw-vt__grid")).not.toBeNull();
    expect(dom.querySelector(".rw-vt__list")).toBeNull();
  });

  it("renders list layout by default", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    expect(dom.querySelector(".rw-vt__list")).not.toBeNull();
    expect(dom.querySelector(".rw-vt__grid")).toBeNull();
  });

  it("renders empty state when no testimonials", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig({ video_testimonials: [] });
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    const empty = dom.querySelector(".rw-empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("No video testimonials available.");
  });

  it("renders disclaimer when showDisclaimer is true", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const disclaimer = dom.querySelector(".rw-vt__disclaimer");
    expect(disclaimer).not.toBeNull();
    expect(disclaimer?.textContent).toContain("Equal Housing Lender");

    const nmlsLink = dom.querySelector(".rw-vt__disclaimer__nmls-link") as HTMLAnchorElement;
    expect(nmlsLink.textContent).toBe("NMLS Consumer Access");
    expect(nmlsLink.href).toContain("nmlsconsumeraccess.org");
  });

  it("renders branding footer", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const branding = dom.querySelector(".rw-branding a") as HTMLAnchorElement;
    expect(branding).not.toBeNull();
    expect(branding.textContent).toBe("RepWell");
  });

  it("hides branding when showBranding is false", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const config = makeConfig();
    config.config.content = { ...config.config.content, showBranding: false };
    const dom = buildVideoTestimonialDOM(config, [], "https://api.test");

    expect(dom.querySelector(".rw-branding")).toBeNull();
  });

  it("renders widget container with ARIA region", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    expect(dom.getAttribute("role")).toBe("region");
    expect(dom.getAttribute("aria-label")).toBe("Video Testimonials");
  });

  it("renders custom controls (play/pause, progress, volume, fullscreen)", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const controls = dom.querySelector(".rw-vt__controls");
    expect(controls).not.toBeNull();

    const progress = dom.querySelector(".rw-vt__progress");
    expect(progress).not.toBeNull();
    expect(progress?.getAttribute("role")).toBe("slider");

    const time = dom.querySelector(".rw-vt__time");
    expect(time?.textContent).toBe("0:00 / 0:00");

    const volumeSlider = dom.querySelector(".rw-vt__volume-slider") as HTMLInputElement;
    expect(volumeSlider).not.toBeNull();
    expect(volumeSlider.getAttribute("aria-label")).toBe("Volume");

    const ctrlBtns = dom.querySelectorAll(".rw-vt__ctrl-btn");
    // play/pause, volume, fullscreen = 3 buttons
    expect(ctrlBtns.length).toBeGreaterThanOrEqual(3);
  });

  it("renders error state element (hidden by default)", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const errorEl = dom.querySelector(".rw-vt__error") as HTMLElement;
    expect(errorEl).not.toBeNull();
    expect(errorEl.style.display).toBe("none");

    const retryBtn = dom.querySelector(".rw-vt__retry-btn");
    expect(retryBtn).not.toBeNull();
    expect(retryBtn?.textContent).toBe("Retry");
  });

  it("renders player wrapper with accessible region label", async () => {
    const { buildVideoTestimonialDOM } = await import(
      "../widgets/video-testimonial/template"
    );
    const dom = buildVideoTestimonialDOM(makeConfig(), [], "https://api.test");

    const playerWraps = dom.querySelectorAll(".rw-vt__player-wrap");
    expect(playerWraps[0].getAttribute("role")).toBe("region");
    expect(playerWraps[0].getAttribute("aria-label")).toBe(
      "Video testimonial by John Doe"
    );
    expect(playerWraps[1].getAttribute("aria-label")).toBe(
      "Video testimonial by Sarah Connor"
    );
  });
});

// ── Transcript component tests ───────────────────────────────────────

describe("Video Transcript component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("builds transcript with segments and title", async () => {
    const { buildTranscript } = await import(
      "../widgets/video-testimonial/transcript"
    );
    const segments = [
      { start: 0, end: 5, text: "Hello world." },
      { start: 5, end: 10, text: "Goodbye world." },
    ];
    const { element } = buildTranscript(segments);

    expect(element.querySelector(".rw-vt__transcript-title")?.textContent).toBe(
      "Transcript"
    );
    const segs = element.querySelectorAll(".rw-vt__transcript-seg");
    expect(segs).toHaveLength(2);
    expect(segs[0].textContent).toBe("Hello world.");
    expect((segs[0] as HTMLElement).dataset.start).toBe("0");
    expect((segs[0] as HTMLElement).dataset.end).toBe("5");
  });

  it("has accessible region attributes", async () => {
    const { buildTranscript } = await import(
      "../widgets/video-testimonial/transcript"
    );
    const { element } = buildTranscript([{ start: 0, end: 5, text: "Test." }]);

    expect(element.getAttribute("role")).toBe("region");
    expect(element.getAttribute("aria-label")).toBe("Video transcript");
  });
});

// ── Registration test ────────────────────────────────────────────────

describe("Video Testimonial Widget registration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("self-registers as video_testimonial widget type", async () => {
    const { getWidgetRenderer } = await import("../widgets/registry");
    await import("../widgets/video-testimonial");

    const renderer = getWidgetRenderer("video_testimonial");
    expect(renderer).not.toBeNull();
    expect(typeof renderer).toBe("function");
  });
});
