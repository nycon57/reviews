/**
 * Carousel transition effects — slide, fade, and flip.
 * All transitions use CSS transforms/opacity for GPU acceleration.
 */

export type TransitionMode = "slide" | "fade" | "flip";

/**
 * Apply the slide transition: translateX-based movement.
 * The track container shifts based on the current index and visible card count.
 */
export function applySlideTransition(
  track: HTMLElement,
  index: number,
  visibleCards: number,
): void {
  const offsetPercent = -(index * (100 / visibleCards));
  track.style.transform = `translateX(${offsetPercent}%)`;
  track.style.transition = "transform 300ms ease";
}

/**
 * Apply the fade transition: opacity-based crossfade between slides.
 * Makes all cards invisible except those in the visible range.
 */
export function applyFadeTransition(
  cards: HTMLElement[],
  index: number,
  visibleCards: number,
): void {
  for (let i = 0; i < cards.length; i++) {
    const inView = i >= index && i < index + visibleCards;
    cards[i].style.opacity = inView ? "1" : "0";
    cards[i].style.transition = "opacity 300ms ease";
    cards[i].style.position = inView ? "relative" : "absolute";
    cards[i].style.pointerEvents = inView ? "auto" : "none";
  }
}

/**
 * Apply the flip transition: 3D rotateY effect.
 * Uses CSS perspective and backface-visibility for the flip.
 */
export function applyFlipTransition(
  cards: HTMLElement[],
  index: number,
  visibleCards: number,
): void {
  for (let i = 0; i < cards.length; i++) {
    const inView = i >= index && i < index + visibleCards;
    if (inView) {
      cards[i].style.transform = "perspective(800px) rotateY(0deg)";
      cards[i].style.opacity = "1";
      cards[i].style.position = "relative";
      cards[i].style.pointerEvents = "auto";
    } else {
      cards[i].style.transform = "perspective(800px) rotateY(90deg)";
      cards[i].style.opacity = "0";
      cards[i].style.position = "absolute";
      cards[i].style.pointerEvents = "none";
    }
    cards[i].style.transition = "transform 400ms ease, opacity 400ms ease";
    cards[i].style.backfaceVisibility = "hidden";
  }
}

/**
 * Apply the appropriate transition based on the mode.
 */
export function applyTransition(
  mode: TransitionMode,
  track: HTMLElement,
  cards: HTMLElement[],
  index: number,
  visibleCards: number,
): void {
  switch (mode) {
    case "slide":
      applySlideTransition(track, index, visibleCards);
      break;
    case "fade":
      applyFadeTransition(cards, index, visibleCards);
      break;
    case "flip":
      applyFlipTransition(cards, index, visibleCards);
      break;
  }
}
