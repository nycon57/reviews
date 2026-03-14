import { WidgetApiError } from "./api-client";

/**
 * Client-side domain validation for the embed script.
 *
 * This is a UX convenience — not a security boundary.
 * The real enforcement happens server-side via CORS headers in the API routes.
 * This module provides faster feedback by detecting 403 responses and
 * surfacing a clear error message to the host page developer.
 */

export class DomainNotAllowedError extends Error {
  constructor(widgetId: string) {
    super(
      `Widget "${widgetId}" is not authorized for this domain. ` +
        "Check the allowed domains in your widget settings."
    );
    this.name = "DomainNotAllowedError";
  }
}

/**
 * Wrap a fetch call and convert HTTP 403 responses into DomainNotAllowedError.
 * All other errors pass through unchanged.
 */
export async function fetchWithDomainCheck<T>(
  widgetId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    return await fetchFn();
  } catch (err) {
    if (err instanceof WidgetApiError && err.status === 403) {
      throw new DomainNotAllowedError(widgetId);
    }
    throw err;
  }
}
