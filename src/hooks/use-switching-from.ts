"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Valid competitor slugs for switching_from tracking
// ---------------------------------------------------------------------------

const VALID_SLUGS = new Set([
  "experience-com",
  "birdeye",
  "socialsurvey",
  "total-expert",
  "trustpilot",
]);

const STORAGE_KEY = "rw_switching_from";
const COOKIE_NAME = "rw_switching_from";
const COOKIE_MAX_AGE_DAYS = 30;

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function setCookie(name: string, value: string, days: number): void {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Resolve the competitor slug from URL param, localStorage, or cookie.
 * Returns null if none found or invalid.
 */
function resolveCompetitor(paramValue: string | null): string | null {
  if (paramValue && VALID_SLUGS.has(paramValue)) {
    return paramValue;
  }

  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_SLUGS.has(stored)) return stored;
  } catch {
    // localStorage unavailable
  }

  const cookieVal = getCookie(COOKIE_NAME);
  if (cookieVal && VALID_SLUGS.has(cookieVal)) return cookieVal;

  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSwitchingFromReturn {
  /** The validated competitor slug, or null if not set */
  competitor: string | null;
  /** Fire a tracking event with the switching_from context */
  trackEvent: (action: string) => void;
}

/**
 * Reads `?switching_from=<slug>` from the URL, persists it in localStorage
 * and a 30-day cookie, and provides a helper to fire analytics events
 * with the competitor context attached.
 *
 * Invalid slugs are silently ignored.
 */
export function useSwitchingFrom(): UseSwitchingFromReturn {
  const searchParams = useSearchParams();
  const paramValue = searchParams.get("switching_from");

  // Derive competitor synchronously — no setState needed
  const competitor = resolveCompetitor(paramValue);

  // Persist to localStorage + cookie when we have a valid URL param
  const persisted = useRef(false);
  useEffect(() => {
    if (competitor && !persisted.current) {
      persisted.current = true;
      try {
        localStorage.setItem(STORAGE_KEY, competitor);
      } catch {
        // localStorage unavailable
      }
      setCookie(COOKIE_NAME, competitor, COOKIE_MAX_AGE_DAYS);
    }
  }, [competitor]);

  const trackEvent = useCallback(
    (action: string) => {
      if (!competitor) return;

      // Push to dataLayer if present (Google Tag Manager / GA4)
      const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
      if (Array.isArray(win.dataLayer)) {
        win.dataLayer.push({
          event: "cta_click",
          action,
          switching_from: competitor,
        });
      }

      // Also dispatch a custom DOM event so any analytics wrapper can listen
      window.dispatchEvent(
        new CustomEvent("rw:cta_click", {
          detail: { action, switching_from: competitor },
        }),
      );
    },
    [competitor],
  );

  return useMemo(
    () => ({ competitor, trackEvent }),
    [competitor, trackEvent],
  );
}

// ---------------------------------------------------------------------------
// Utility: build an href that preserves switching_from
// ---------------------------------------------------------------------------

/**
 * Appends `?switching_from=<slug>` to a given href when the competitor
 * context is active. Returns the original href if no competitor is set.
 */
export function appendSwitchingFrom(
  href: string,
  competitor: string | null,
): string {
  if (!competitor) return href;

  try {
    const url = new URL(href, window.location.origin);
    url.searchParams.set("switching_from", competitor);
    // Return pathname + search for relative URLs, full URL for external
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch {
    // href is not a parseable URL — return as-is
    return href;
  }
}
