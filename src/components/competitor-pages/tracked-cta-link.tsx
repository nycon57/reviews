"use client";

import { type AnchorHTMLAttributes, type MouseEvent, useCallback } from "react";
import { appendSwitchingFrom } from "@/hooks/use-switching-from";
import { useSwitchingFromContext } from "./switching-from-provider";

interface TrackedCtaLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Analytics action name (e.g. "hero_primary_cta") */
  trackingAction?: string;
}

/**
 * An anchor element that:
 * 1. Appends `?switching_from=<slug>` to its href
 * 2. Fires a tracking event on click with the competitor context
 *
 * Renders a standard <a> — accepts all native anchor props.
 */
export function TrackedCtaLink({
  href,
  trackingAction,
  onClick,
  children,
  ...rest
}: TrackedCtaLinkProps) {
  const { competitor, trackEvent } = useSwitchingFromContext();

  const resolvedHref = href ? appendSwitchingFrom(href, competitor) : href;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (trackingAction) {
        trackEvent(trackingAction);
      }
      onClick?.(e);
    },
    [trackingAction, trackEvent, onClick],
  );

  return (
    <a href={resolvedHref} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
