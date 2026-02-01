/**
 * Branch Review Widget template — builds the DOM tree for branch-level reviews.
 * Reuses shared builders from shared-builders to minimize bundle size.
 * Adds branch-specific header (address, phone) and team member grid.
 */

import type {
  PublicWidgetConfig,
  PublicReview,
  EntityProfile,
  TeamMember,
} from "../../types";
import {
  el,
  text,
  getInitials,
} from "../../core/dom-helpers";
import { buildNmlsBadge } from "../../components/nmls-badge";
import { trackClick } from "../../core/event-tracker";
import {
  starsRow,
  buildRatingDistribution,
  buildSourceBreakdown,
  buildReviewListSection,
  appendWidgetFooter,
} from "../company-review/template";

// ── Branch-specific helpers ──────────────────────────────────────────

function formatAddress(addr: EntityProfile["address"]): string | null {
  if (!addr) return null;
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  const cs: string[] = [];
  if (addr.city) cs.push(addr.city);
  if (addr.state) cs.push(addr.state);
  if (cs.length > 0) {
    let l = cs.join(", ");
    if (addr.zip) l += ` ${addr.zip}`;
    parts.push(l);
  } else if (addr.zip) {
    parts.push(addr.zip);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

function fmtPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return phone;
}

// ── Branch Header ────────────────────────────────────────────────────

function buildBranchHeader(
  profile: EntityProfile,
  starFilled: string,
  starEmpty: string
): HTMLElement {
  const section = el("div", "rw-br-header");
  const logoUrl = profile.logo_url ?? profile.photo_url;
  if (logoUrl) {
    const img = document.createElement("img");
    img.className = "rw-br-header__logo";
    img.src = logoUrl;
    img.alt = profile.organization_name ?? profile.full_name ?? "Branch";
    img.loading = "lazy";
    section.appendChild(img);
  } else {
    section.appendChild(text("div", getInitials(profile.organization_name ?? profile.full_name), "rw-br-header__logo-placeholder"));
  }

  const info = el("div", "rw-br-header__info");
  const name = profile.organization_name ?? profile.full_name;
  if (name) info.appendChild(text("h3", name, "rw-br-header__name"));

  const addr = formatAddress(profile.address);
  if (addr) info.appendChild(text("div", addr, "rw-br-header__address"));

  if (profile.telephone) {
    const ph = el("div", "rw-br-header__phone");
    const a = document.createElement("a");
    a.href = `tel:${profile.telephone}`;
    a.textContent = fmtPhone(profile.telephone);
    ph.appendChild(a);
    info.appendChild(ph);
  }

  const nmls = buildNmlsBadge(profile.nmls_id, "company", "rw-br-header__nmls");
  if (nmls) info.appendChild(nmls);

  if (profile.average_rating != null) {
    const row = el("div", "rw-br-header__rating");
    row.appendChild(text("span", profile.average_rating.toFixed(1), "rw-br-header__rating-value"));
    row.appendChild(starsRow(Math.round(profile.average_rating), starFilled, starEmpty, "rw-br-header__stars"));
    if (profile.total_reviews != null) {
      row.appendChild(text("span", `${profile.total_reviews} review${profile.total_reviews === 1 ? "" : "s"}`, "rw-br-header__rating-count"));
    }
    info.appendChild(row);
  }

  section.appendChild(info);
  return section;
}

// ── Team Member Grid ─────────────────────────────────────────────────

function buildTeamGrid(members: TeamMember[], starFilled: string, starEmpty: string): HTMLElement {
  const section = el("div", "rw-br-team");
  section.appendChild(text("h4", "Our Team", "rw-br-team__title"));
  const grid = el("div", "rw-br-team__grid");

  for (const m of members) {
    const card = el("div", "rw-br-team__card");
    if (m.photo_url) {
      const img = document.createElement("img");
      img.className = "rw-br-team__photo";
      img.src = m.photo_url;
      img.alt = m.full_name ?? "Team member";
      img.loading = "lazy";
      card.appendChild(img);
    } else {
      card.appendChild(text("div", getInitials(m.full_name), "rw-br-team__photo-placeholder"));
    }
    const info = el("div", "rw-br-team__info");
    if (m.full_name) info.appendChild(text("div", m.full_name, "rw-br-team__name"));
    if (m.title) info.appendChild(text("div", m.title, "rw-br-team__role"));
    if (m.average_rating != null) {
      const r = el("div", "rw-br-team__rating");
      r.appendChild(text("span", m.average_rating.toFixed(1), "rw-br-team__rating-value"));
      r.appendChild(starsRow(Math.round(m.average_rating), starFilled, starEmpty, "rw-br-team__stars"));
      if (m.total_reviews != null) r.appendChild(text("span", `(${m.total_reviews})`, "rw-br-team__rating-count"));
      info.appendChild(r);
    }
    card.appendChild(info);
    grid.appendChild(card);
  }

  section.appendChild(grid);
  return section;
}

// ── Main Builder ─────────────────────────────────────────────────────

export function buildBranchReviewDOM(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  apiBase: string,
  instance?: import("../../types").WidgetInstance,
): HTMLElement {
  const cfg = config.config;
  const content = cfg?.content;
  const colors = cfg?.theme?.colors;
  const profile = config.entity_profile;

  const container = el("div", "rw-widget");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", content?.headerText ?? `Reviews for ${profile?.organization_name ?? profile?.full_name ?? "Branch"}`);

  const starFilled = colors?.starFilled ?? "#f59e0b";
  const starEmpty = colors?.starEmpty ?? "#d1d5db";

  // Branch header (unique to branch widget)
  if (profile && content?.showHeader !== false) {
    container.appendChild(buildBranchHeader(profile, starFilled, starEmpty));
  }

  // Rating distribution (reuses shared builder + rw-co- styles)
  if (content?.showRatingDistribution !== false && profile?.rating_distribution && profile.total_reviews) {
    container.appendChild(buildRatingDistribution(profile.rating_distribution, profile.total_reviews, starFilled, starEmpty));
  }

  // Source breakdown (reuses shared builder + rw-co- styles)
  if (content?.showSourceBreakdown !== false && profile?.source_breakdown && profile.source_breakdown.length > 0) {
    container.appendChild(buildSourceBreakdown(profile.source_breakdown, starFilled, starEmpty));
  }

  // Team member grid (unique to branch widget)
  if (content?.showTeam !== false && profile?.team_members && profile.team_members.length > 0) {
    container.appendChild(buildTeamGrid(profile.team_members, starFilled, starEmpty));
  }

  // Reviews list (reuses shared builder with branch-specific empty state)
  const emptyNode = (() => {
    const empty = el("div", "rw-br-empty");
    empty.appendChild(text("div", "No reviews yet for this branch.", "rw-br-empty__text"));
    if (content?.showWriteReview && content.writeReviewUrl) {
      const cta = document.createElement("a");
      cta.className = "rw-br-empty__cta";
      cta.textContent = "Be the first to leave a review";
      cta.href = content.writeReviewUrl;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.addEventListener("click", () => { trackClick(apiBase, config.widget_id, "click_write_review"); });
      empty.appendChild(cta);
    }
    return empty;
  })();

  buildReviewListSection(container, reviews, config, starFilled, starEmpty, apiBase, emptyNode, instance);

  // Actions + disclaimer + branding (reuses shared builder)
  appendWidgetFooter(container, config, apiBase);

  return container;
}
