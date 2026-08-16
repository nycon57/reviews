"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): string {
  return window.location.origin;
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Returns `window.location.origin` without a hydration mismatch: `null` on the
 * server and on the first client render, then the real origin after hydration.
 */
export function useOrigin(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
