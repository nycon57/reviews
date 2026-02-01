/**
 * Lazy-loads widgets via Intersection Observer.
 * Triggers the load callback when a widget element enters the viewport
 * (with 200px rootMargin for perceived instant loading).
 *
 * Each element gets its own callback via a Map, sharing a single observer.
 */

const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          observer!.unobserve(entry.target);
          callbacks.delete(entry.target);
          cb?.();
        }
      }
    },
    { rootMargin: "200px" }
  );

  return observer;
}

export function observe(element: HTMLElement, onVisible: () => void): void {
  // Fallback for environments without IntersectionObserver
  if (typeof IntersectionObserver === "undefined") {
    onVisible();
    return;
  }

  callbacks.set(element, onVisible);
  getObserver().observe(element);
}

export function unobserve(element: HTMLElement): void {
  callbacks.delete(element);
  observer?.unobserve(element);
}

export function disconnectObserver(): void {
  observer?.disconnect();
  observer = null;
  callbacks.clear();
}
