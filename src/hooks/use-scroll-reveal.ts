"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean indicating whether the referenced element
 * has scrolled into view. Once triggered the boolean stays `true`.
 *
 * Respects `prefers-reduced-motion` by revealing immediately without
 * waiting for an intersection event.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.1,
): { ref: React.RefObject<T | null>; isVisible: boolean } {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
