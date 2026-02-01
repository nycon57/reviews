"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed progress bar at the top of the page that fills
 * as the user scrolls down the competitor comparison page.
 *
 * Uses direct DOM manipulation instead of React state to avoid
 * re-renders on every scroll frame.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const container = containerRef.current;
    if (!bar || !container) return;

    let rafId: number | null = null;

    function handleScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const pct = Math.min(scrollTop / docHeight, 1);
          bar!.style.transform = `scaleX(${pct})`;
          container!.setAttribute(
            "aria-valuenow",
            String(Math.round(pct * 100)),
          );
        }
        rafId = null;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 z-50 h-0.5 w-full bg-transparent"
      style={{ contain: "layout style" }}
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-repwell-teal-300"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
