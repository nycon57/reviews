/**
 * Shared First-Time Homebuyer Badge component for embed widgets.
 * Renders a house icon + "First-Time Buyer" text badge.
 */

import { el } from "../core/dom-helpers";
import { createHouseIconSVG } from "../assets/equal-housing-lender";

/**
 * Build the first-time homebuyer badge element.
 * @param className - Full CSS class name (e.g. "rw-lo-review__fthb-badge")
 */
export function buildFirstTimeBuyerBadge(className: string): HTMLElement {
  const badge = el("span", className);
  badge.appendChild(createHouseIconSVG(11));
  badge.appendChild(document.createTextNode("First-Time Buyer"));
  return badge;
}
