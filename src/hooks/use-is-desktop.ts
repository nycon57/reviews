"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_BREAKPOINT = 1024; // lg breakpoint

function getSnapshot(): boolean {
  return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
}

function getServerSnapshot(): boolean {
  return false; // Default to mobile on server
}

function subscribe(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

/**
 * Hook that returns true when viewport width >= 1024px (lg breakpoint)
 * Returns false during SSR and on mobile/tablet viewports
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
