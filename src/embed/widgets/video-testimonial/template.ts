/**
 * Video Testimonial Widget template — builds the DOM tree for video testimonials.
 * Displays inline video player, transcript, LO/reviewer info, and compliance footer.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  VideoTestimonial,
  EntityProfile,
} from "../../types";
import { el, text, starSVG, getInitials } from "../../core/dom-helpers";
import { createEqualHousingLenderSVG } from "../../assets/equal-housing-lender";
import { t } from "../../i18n";
import { buildVideoPlayer } from "./player";
import { buildTranscript } from "./transcript";

const NMLS_INDIVIDUAL_BASE = "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/";

function buildLOSection(
  profile: EntityProfile,
  starFilled: string,
  starEmpty: string,
): HTMLElement {
  const section = el("div", "rw-vt__lo");

  if (profile.photo_url || profile.avatar_url) {
    const img = document.createElement("img");
    img.className = "rw-vt__lo-photo";
    img.src = (profile.photo_url ?? profile.avatar_url)!;
    img.alt = profile.full_name ?? "Loan Officer";
    img.loading = "lazy";
    section.appendChild(img);
  } else {
    section.appendChild(
      text("div", getInitials(profile.full_name), "rw-vt__lo-photo-placeholder"),
    );
  }

  const info = el("div", "rw-vt__lo-info");
  if (profile.full_name) info.appendChild(text("div", profile.full_name, "rw-vt__lo-name"));

  if (profile.nmls_id) {
    const nmlsWrap = el("div", "rw-vt__lo-nmls");
    nmlsWrap.textContent = "NMLS# ";
    const nmlsLink = document.createElement("a");
    nmlsLink.textContent = profile.nmls_id;
    nmlsLink.href = `${NMLS_INDIVIDUAL_BASE}${encodeURIComponent(profile.nmls_id)}`;
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.setAttribute("aria-label", `NMLS ID ${profile.nmls_id}`);
    nmlsWrap.appendChild(nmlsLink);
    info.appendChild(nmlsWrap);
  }

  section.appendChild(info);

  if (profile.average_rating != null) {
    const ratingWrap = el("div", "rw-vt__lo-rating");
    ratingWrap.appendChild(text("span", profile.average_rating.toFixed(1), ""));
    for (let i = 1; i <= 5; i++) {
      ratingWrap.appendChild(
        starSVG(i <= Math.round(profile.average_rating), starFilled, starEmpty),
      );
    }
    section.appendChild(ratingWrap);
  }

  return section;
}

function buildVideoItem(
  testimonial: VideoTestimonial,
  config: PublicWidgetConfig,
  apiBase: string,
  transcriptPosition: "below" | "side" | "hidden",
  starFilled: string,
  starEmpty: string,
): HTMLElement {
  const isSide = transcriptPosition === "side" && testimonial.transcript?.length;
  const item = el("div", `rw-vt__item${isSide ? " rw-vt__item--side" : ""}`);

  // Content wrapper for side layout
  const contentWrap = isSide ? el("div", "rw-vt__content") : item;

  // Video player
  const player = buildVideoPlayer(testimonial, apiBase, config.widget_id);
  if (isSide) {
    contentWrap.appendChild(player);
  } else {
    item.appendChild(player);
  }

  // Side panel for transcript (side layout only)
  let sidePanel: HTMLElement | null = null;
  if (isSide) {
    sidePanel = el("div", "rw-vt__side-panel");
  }

  // Reviewer info section
  const infoSection = el("div", "rw-vt__info");
  const reviewerRow = el("div", "rw-vt__reviewer");
  reviewerRow.appendChild(
    text("div", getInitials(testimonial.reviewer_name), "rw-vt__avatar-placeholder"),
  );
  const reviewerInfo = el("div", "rw-vt__reviewer-info");
  if (testimonial.reviewer_name) {
    reviewerInfo.appendChild(text("div", testimonial.reviewer_name, "rw-vt__reviewer-name"));
  }
  if (testimonial.reviewer_title) {
    reviewerInfo.appendChild(text("div", testimonial.reviewer_title, "rw-vt__reviewer-title"));
  }
  reviewerRow.appendChild(reviewerInfo);
  infoSection.appendChild(reviewerRow);

  // Stars
  if (testimonial.rating > 0) {
    const starsWrap = el("div", "rw-vt__stars");
    starsWrap.setAttribute("role", "img");
    starsWrap.setAttribute("aria-label", t("starsAriaLabel", { rating: testimonial.rating }));
    for (let i = 1; i <= 5; i++) {
      starsWrap.appendChild(starSVG(i <= testimonial.rating, starFilled, starEmpty));
    }
    infoSection.appendChild(starsWrap);
  }

  if (isSide && sidePanel) {
    sidePanel.appendChild(infoSection);
  } else {
    item.appendChild(infoSection);
  }

  // LO info
  const profile = config.entity_profile;
  if (profile && config.config?.content?.showHeader !== false) {
    const loSection = buildLOSection(profile, starFilled, starEmpty);
    if (isSide && sidePanel) {
      sidePanel.appendChild(loSection);
    } else {
      item.appendChild(loSection);
    }
  }

  // Transcript
  if (
    transcriptPosition !== "hidden" &&
    testimonial.transcript &&
    testimonial.transcript.length > 0
  ) {
    const { element: transcriptEl, connectToVideo } = buildTranscript(testimonial.transcript);

    if (isSide && sidePanel) {
      sidePanel.appendChild(transcriptEl);
    } else {
      item.appendChild(transcriptEl);
    }

    // Connect transcript to video when it is created (including after retry)
    const playerWrap = player as HTMLElement & {
      _getVideo: () => HTMLVideoElement | null;
      _onVideoCreated?: (v: HTMLVideoElement) => void;
    };
    playerWrap._onVideoCreated = (vid: HTMLVideoElement) => {
      connectToVideo(vid);
    };
  }

  if (isSide && sidePanel) {
    contentWrap.appendChild(sidePanel);
    item.appendChild(contentWrap);
  }

  return item;
}

/**
 * Builds the Video Testimonial widget DOM tree.
 */
export function buildVideoTestimonialDOM(
  config: PublicWidgetConfig,
  _reviews: PublicReview[],
  apiBase: string,
): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const videoConfig = cfg?.video;

  const container = el("div", "rw-widget rw-vt");
  container.setAttribute("role", "region");
  container.setAttribute(
    "aria-label",
    content?.headerText ?? t("videoTestimonials"),
  );

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";
  const transcriptPosition = videoConfig?.transcriptPosition ?? "below";
  const layout = videoConfig?.layout ?? "list";

  // Video testimonials data
  const testimonials = config.video_testimonials ?? [];

  if (testimonials.length === 0) {
    container.appendChild(
      text("div", t("noVideoTestimonials"), "rw-empty"),
    );
  } else {
    const listContainer = el(
      "div",
      layout === "grid" ? "rw-vt__grid" : "rw-vt__list",
    );
    for (const testimonial of testimonials) {
      listContainer.appendChild(
        buildVideoItem(
          testimonial,
          config,
          apiBase,
          transcriptPosition,
          starFilled,
          starEmpty,
        ),
      );
    }
    container.appendChild(listContainer);
  }

  // Compliance disclaimer
  if (content?.showDisclaimer) {
    const disclaimer = el("div", "rw-vt__disclaimer");
    const ehl = el("div", "rw-vt__disclaimer-ehl");
    ehl.appendChild(createEqualHousingLenderSVG(18));
    ehl.appendChild(document.createTextNode(t("equalHousingLender")));
    disclaimer.appendChild(ehl);
    const defaultDisclaimer = t("defaultDisclaimer");
    disclaimer.appendChild(
      text(
        "div",
        content.disclaimerText || defaultDisclaimer,
        "rw-vt__disclaimer-text",
      ),
    );
    const nmlsLink = document.createElement("a");
    nmlsLink.className = "rw-vt__disclaimer-link";
    nmlsLink.href = "https://www.nmlsconsumeraccess.org";
    nmlsLink.target = "_blank";
    nmlsLink.rel = "noopener noreferrer";
    nmlsLink.textContent = "NMLS Consumer Access";
    disclaimer.appendChild(nmlsLink);
    container.appendChild(disclaimer);
  }

  // Branding footer
  if (content?.showBranding !== false) {
    const branding = el("div", "rw-branding");
    branding.textContent = `${t("poweredBy")} `;
    const link = document.createElement("a");
    link.href = "https://repwell.com";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "RepWell";
    branding.appendChild(link);
    container.appendChild(branding);
  }

  return container;
}
