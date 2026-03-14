/**
 * NPS Score Badge Widget template — builds the badge DOM.
 * Two display modes:
 *   - gauge: SVG semicircular dial with colored zones and animated needle
 *   - numeric: large NPS number with +/- sign, color-coded by zone
 * Optional breakdown bar showing promoter/passive/detractor percentages.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, NpsData, WidgetNps } from "../../types";
import { el, text } from "../../core/dom-helpers";
import { trackClick } from "../../core/event-tracker";
import { t, tp } from "../../i18n";

// ── NPS Zone Helpers ────────────────────────────────────────────────

type NpsZone = "red" | "yellow" | "light-green" | "dark-green";

function getNpsZone(score: number): NpsZone {
  if (score < 0) return "red";
  if (score <= 30) return "yellow";
  if (score <= 70) return "light-green";
  return "dark-green";
}

function getZoneColor(zone: NpsZone): string {
  switch (zone) {
    case "red":
      return "#ef4444";
    case "yellow":
      return "#eab308";
    case "light-green":
      return "#22c55e";
    case "dark-green":
      return "#16a34a";
  }
}

function formatNpsScore(score: number): string {
  if (score > 0) return `+${Math.round(score)}`;
  return String(Math.round(score));
}

// ── SVG Helpers ─────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag: string): SVGElement {
  return document.createElementNS(SVG_NS, tag);
}

function setAttrs(node: SVGElement, attrs: Record<string, string>): void {
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
  }
}

/**
 * Compute a point on a circle for the gauge arc.
 * Angles are in degrees, 0 = top of semicircle (left side of gauge).
 */
function arcPoint(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const [sx, sy] = arcPoint(cx, cy, r, startAngle);
  const [ex, ey] = arcPoint(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

// ── Gauge Builder ───────────────────────────────────────────────────

function buildGauge(npsScore: number): HTMLElement {
  const wrapper = el("div", "rw-nps__gauge");

  const svg = svgEl("svg");
  setAttrs(svg, {
    viewBox: "0 0 180 100",
    "aria-hidden": "true",
  });

  const cx = 90;
  const cy = 90;
  const r = 70;

  // Gauge zones: Detractors (0-60%), Passives (60-80%), Promoters (80-100%) of the semicircle
  // Map to angles: 0° to 180° across the top semicircle
  const zones: { start: number; end: number; color: string }[] = [
    { start: 0, end: 108, color: "#ef4444" },   // Detractors: 0-60% of arc
    { start: 108, end: 144, color: "#eab308" },  // Passives: 60-80% of arc
    { start: 144, end: 180, color: "#22c55e" },  // Promoters: 80-100% of arc
  ];

  for (const zone of zones) {
    const path = svgEl("path");
    setAttrs(path, {
      d: describeArc(cx, cy, r, zone.start, zone.end),
      class: "rw-nps__gauge-zone",
      stroke: zone.color,
      opacity: "0.25",
    });
    svg.appendChild(path);
  }

  // Active arc up to the NPS score position
  // NPS range: -100 to +100 → angle 0° to 180°
  const clampedScore = Math.max(-100, Math.min(100, npsScore));
  const scoreAngle = ((clampedScore + 100) / 200) * 180;

  if (scoreAngle > 0.5) {
    const zone = getNpsZone(npsScore);
    const activePath = svgEl("path");
    setAttrs(activePath, {
      d: describeArc(cx, cy, r, 0, scoreAngle),
      class: "rw-nps__gauge-zone",
      stroke: getZoneColor(zone),
    });
    svg.appendChild(activePath);
  }

  // Needle — drawn pointing straight up (neutral), rotated via CSS transform.
  // The CSS animation sweeps from -90deg (left/0°) to the final angle.
  const needle = svgEl("polygon");
  // Tip points straight up from center
  const tipX = cx;
  const tipY = cy - (r - 16);
  // Base points spread horizontally at center
  const baseOffset = 3;
  const b1x = cx + baseOffset;
  const b1y = cy;
  const b2x = cx - baseOffset;
  const b2y = cy;

  setAttrs(needle, {
    points: `${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`,
    class: "rw-nps__gauge-needle rw-nps__gauge-needle--animated",
    style: `transform: rotate(${scoreAngle - 90}deg)`,
  });
  svg.appendChild(needle);

  // Center dot
  const centerCircle = svgEl("circle");
  setAttrs(centerCircle, {
    cx: String(cx),
    cy: String(cy),
    r: "6",
    class: "rw-nps__gauge-center",
  });
  svg.appendChild(centerCircle);

  // Score text below gauge center
  const scoreText = svgEl("text");
  setAttrs(scoreText, {
    x: String(cx),
    y: String(cy - 20),
    class: "rw-nps__gauge-score",
  });
  scoreText.textContent = formatNpsScore(npsScore);
  svg.appendChild(scoreText);

  wrapper.appendChild(svg);
  return wrapper;
}

// ── Numeric Builder ─────────────────────────────────────────────────

function buildNumeric(npsScore: number): HTMLElement {
  const wrapper = el("div", "rw-nps__numeric");
  const zone = getNpsZone(npsScore);
  const scoreEl = text("span", formatNpsScore(npsScore), `rw-nps__score rw-nps-zone--${zone}`);
  wrapper.appendChild(scoreEl);
  return wrapper;
}

// ── Breakdown Bar ───────────────────────────────────────────────────

function buildBreakdown(npsData: NpsData): HTMLElement {
  const wrapper = el("div", "rw-nps__breakdown");

  // Stacked bar
  const bar = el("div", "rw-nps__breakdown-bar");

  const promoterSeg = el("div", "rw-nps__breakdown-seg rw-nps__breakdown-seg--promoter");
  promoterSeg.style.width = `${npsData.promoterPct}%`;
  bar.appendChild(promoterSeg);

  const passiveSeg = el("div", "rw-nps__breakdown-seg rw-nps__breakdown-seg--passive");
  passiveSeg.style.width = `${npsData.passivePct}%`;
  bar.appendChild(passiveSeg);

  const detractorSeg = el("div", "rw-nps__breakdown-seg rw-nps__breakdown-seg--detractor");
  detractorSeg.style.width = `${npsData.detractorPct}%`;
  bar.appendChild(detractorSeg);

  wrapper.appendChild(bar);

  // Labels
  const labels = el("div", "rw-nps__breakdown-labels");

  const items: { label: string; pct: number; color: string }[] = [
    { label: t("promoters"), pct: npsData.promoterPct, color: "#22c55e" },
    { label: t("passives"), pct: npsData.passivePct, color: "#eab308" },
    { label: t("detractors"), pct: npsData.detractorPct, color: "#ef4444" },
  ];

  for (const item of items) {
    const labelEl = el("span", "rw-nps__breakdown-item");
    const dot = el("span", "rw-nps__breakdown-dot");
    dot.style.backgroundColor = item.color;
    labelEl.appendChild(dot);
    labelEl.appendChild(document.createTextNode(`${item.label} ${Math.round(item.pct)}%`));
    labels.appendChild(labelEl);
  }

  wrapper.appendChild(labels);
  return wrapper;
}

// ── URL Sanitization ────────────────────────────────────────────────

function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main Builder ────────────────────────────────────────────────────

export function buildNpsScoreBadgeDOM(
  config: PublicWidgetConfig,
  apiBase: string,
): HTMLElement {
  const cfg = config.config;
  const npsCfg: WidgetNps = cfg?.nps ?? {};
  const npsData: NpsData = config.nps_data ?? {
    score: 0,
    totalResponses: 0,
    promoterPct: 0,
    passivePct: 0,
    detractorPct: 0,
  };

  const displayMode = npsCfg.displayMode ?? "gauge";
  const showBreakdown = npsCfg.showBreakdown !== false;
  const showCount = npsCfg.showCount !== false;
  const showPeriod = npsCfg.showPeriod !== false;
  const labelText = npsCfg.labelText ?? t("netPromoterScore");
  const periodText = npsCfg.periodText ?? t("last12Months");

  // Build container
  const badge = cfg?.badge;
  const safeUrl = badge?.clickUrl ? sanitizeUrl(badge.clickUrl) : null;
  let container: HTMLElement;

  if (safeUrl) {
    const link = document.createElement("a");
    link.className = "rw-nps";
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", () => {
      trackClick(apiBase, config, "click_cta");
    });
    container = link;
  } else {
    container = el("div", "rw-nps");
  }

  // Accessible label
  container.setAttribute("role", "img");
  container.setAttribute(
    "aria-label",
    tp("npsAriaLabel", npsData.totalResponses, { score: formatNpsScore(npsData.score), count: npsData.totalResponses }),
  );

  // Display mode
  if (displayMode === "gauge") {
    container.appendChild(buildGauge(npsData.score));
  } else {
    container.appendChild(buildNumeric(npsData.score));
  }

  // Label
  container.appendChild(text("div", labelText, "rw-nps__label"));

  // Response count
  if (showCount && npsData.totalResponses > 0) {
    container.appendChild(
      text(
        "div",
        tp("basedOnResponses", npsData.totalResponses, { count: npsData.totalResponses }),
        "rw-nps__count",
      ),
    );
  }

  // Period
  if (showPeriod && periodText) {
    container.appendChild(text("div", periodText, "rw-nps__period"));
  }

  // Breakdown bar
  if (showBreakdown && npsData.totalResponses > 0) {
    container.appendChild(buildBreakdown(npsData));
  }

  return container;
}
