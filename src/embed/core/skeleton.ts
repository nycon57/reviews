/**
 * CSS-only shimmer skeleton for widget loading state.
 * Fixed height to prevent CLS when reviews render.
 */

const SKELETON_HEIGHT = "280px";

function createShimmer(width: string, height: string, marginBottom?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "rw-shimmer";
  el.style.width = width;
  el.style.height = height;
  if (marginBottom) el.style.marginBottom = marginBottom;
  return el;
}

function createSkeletonCard(): HTMLElement {
  const card = document.createElement("div");
  card.className = "rw-skeleton__card";
  card.appendChild(createShimmer("120px", "16px", "8px"));
  card.appendChild(createShimmer("80px", "12px", "12px"));
  card.appendChild(createShimmer("100%", "12px", "6px"));
  card.appendChild(createShimmer("90%", "12px", "6px"));
  card.appendChild(createShimmer("70%", "12px"));
  return card;
}

export function renderSkeleton(root: ShadowRoot): void {
  const wrapper = document.createElement("div");
  wrapper.className = "rw-skeleton";
  wrapper.setAttribute("aria-busy", "true");
  wrapper.setAttribute("aria-label", "Loading reviews");
  wrapper.style.height = SKELETON_HEIGHT;
  wrapper.style.overflow = "hidden";

  const header = document.createElement("div");
  header.className = "rw-skeleton__header";
  header.appendChild(createShimmer("60%", "24px", "12px"));
  header.appendChild(createShimmer("40%", "16px"));
  wrapper.appendChild(header);

  const cards = document.createElement("div");
  cards.className = "rw-skeleton__cards";
  cards.appendChild(createSkeletonCard());
  cards.appendChild(createSkeletonCard());
  wrapper.appendChild(cards);

  root.appendChild(wrapper);
}

export function removeSkeleton(root: ShadowRoot): void {
  const el = root.querySelector(".rw-skeleton");
  if (el) el.remove();
}
