/**
 * Shared NMLS Badge component for embed widgets.
 * Renders "NMLS# {id}" with a clickable link to nmlsconsumeraccess.org.
 *
 * - For LO (individual) widgets: links to /EntityDetails.aspx/INDIVIDUAL/{id}
 * - For company/branch widgets: links to /EntityDetails.aspx/COMPANY/{id}
 *
 * NMLS display is mandatory for LO widgets per SAFE Act.
 */

import { el } from "../core/dom-helpers";

const NMLS_BASE_INDIVIDUAL =
  "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/";
const NMLS_BASE_COMPANY =
  "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/";

export type NmlsEntityType = "individual" | "company";

/**
 * Build the NMLS badge element: "NMLS# {id}" with link.
 * Returns null if nmlsId is falsy.
 */
export function buildNmlsBadge(
  nmlsId: string | null | undefined,
  entityType: NmlsEntityType,
  className: string,
): HTMLElement | null {
  if (!nmlsId) return null;

  const base =
    entityType === "individual" ? NMLS_BASE_INDIVIDUAL : NMLS_BASE_COMPANY;

  const wrapper = el("div", className);
  wrapper.textContent = "NMLS# ";

  const link = document.createElement("a");
  link.textContent = nmlsId;
  link.href = `${base}${encodeURIComponent(nmlsId)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute(
    "aria-label",
    `NMLS ID ${nmlsId} - view on NMLS Consumer Access`,
  );
  wrapper.appendChild(link);

  return wrapper;
}
