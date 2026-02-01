"use client";

import { useSwitchingFromContext } from "./switching-from-provider";

/**
 * Renders a hidden form field with the switching_from competitor slug.
 * Include this in demo booking forms or contact forms so the attribution
 * data is captured in form submissions.
 */
export function SwitchingFromHiddenField() {
  const { competitor } = useSwitchingFromContext();

  if (!competitor) return null;

  return (
    <input
      type="hidden"
      name="switching_from"
      value={competitor}
    />
  );
}
