"use client";

import { useEffect, useRef, useState } from "react";

interface StatCountUpProps {
  /** The final display value (e.g. "4.9/5") */
  value: string;
  /** Label displayed next to the value */
  label: string;
}

/** Parse the leading numeric portion from a stat value string. */
function parseStatValue(value: string) {
  const match = value.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const target = parseFloat(match[1]);
  const suffix = value.slice(match[0].length);
  const isDecimal = match[0].includes(".");
  const decimalPlaces = isDecimal ? match[0].split(".")[1].length : 0;
  const zero = `0${isDecimal ? "." + "0".repeat(decimalPlaces) : ""}${suffix}`;

  return { target, suffix, decimalPlaces, zero };
}

/**
 * Animated stat counter that counts up when scrolled into view.
 * Extracts the leading numeric portion from `value` and animates from 0.
 * Falls back to instant display if no numeric prefix is found.
 */
export function StatCountUp({ value, label }: StatCountUpProps) {
  const parsed = parseStatValue(value);
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(() => parsed?.zero ?? value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;

    // Respect reduced motion: skip animation, show final value immediately
    // via a microtask to satisfy the React Compiler (no sync setState in effect)
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const { target, suffix, decimalPlaces } = parsed;

    function runAnimation() {
      const duration = 1200;
      const start = window.performance.now();

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        setDisplay(`${current.toFixed(decimalPlaces)}${suffix}`);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    if (prefersReducedMotion) {
      // Show the final value via requestAnimationFrame to avoid sync setState
      requestAnimationFrame(() => setDisplay(value));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();
          runAnimation();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, parsed]);

  return (
    <div
      ref={ref}
      className="mt-12 inline-flex items-baseline gap-3"
      aria-label={`${value} ${label}`}
    >
      <span className="font-display text-4xl font-bold text-repwell-teal-300 md:text-5xl lg:text-6xl">
        {display}
      </span>
      <span className="text-lg font-medium text-repwell-teal-400 md:text-xl">
        {label}
      </span>
    </div>
  );
}
