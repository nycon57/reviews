/**
 * Scroll Depth Tracker — fires events at 25%, 50%, 75%, 100% thresholds.
 * Uses Intersection Observer on sentinel elements placed at each threshold
 * within the widget container (Shadow DOM root element).
 */

import { trackClick } from "./event-tracker";
import type { PublicWidgetConfig } from "../types";

const THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Attaches scroll depth tracking to a widget container.
 * Creates sentinel elements at each threshold of the container's height
 * and fires a `scroll_depth` event when each becomes visible.
 *
 * @returns Cleanup function to disconnect observers and remove sentinels.
 */
export function attachScrollDepthTracking(
  container: HTMLElement,
  apiBase: string,
  config: Pick<PublicWidgetConfig, "widget_id" | "entity_type" | "entity_id" | "override_applied">,
): () => void {
  const fired = new Set<number>();
  const sentinels: HTMLElement[] = [];
  let observer: IntersectionObserver | null = null;

  // Delay setup to ensure container has final dimensions
  const rafId = requestAnimationFrame(() => {
    const height = container.scrollHeight;
    if (height <= 0) return;

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const threshold = Number(
            (entry.target as HTMLElement).dataset.rwScrollThreshold,
          );
          if (threshold && !fired.has(threshold)) {
            fired.add(threshold);
            trackClick(apiBase, config, "scroll_depth", {
              threshold,
            });
            // Stop observing this sentinel
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    for (const pct of THRESHOLDS) {
      const sentinel = document.createElement("div");
      sentinel.style.cssText =
        "position:absolute;left:0;width:1px;height:1px;pointer-events:none;opacity:0;";
      sentinel.style.top = `${(pct / 100) * height}px`;
      sentinel.dataset.rwScrollThreshold = String(pct);
      sentinel.setAttribute("aria-hidden", "true");

      // Container must be positioned for absolute sentinels
      const pos = getComputedStyle(container).position;
      if (pos === "static") {
        container.style.position = "relative";
      }

      container.appendChild(sentinel);
      sentinels.push(sentinel);
      observer.observe(sentinel);
    }
  });

  return () => {
    cancelAnimationFrame(rafId);
    observer?.disconnect();
    for (const s of sentinels) {
      s.remove();
    }
  };
}
