/**
 * Discovers widget placeholder elements on the page.
 * Looks for elements with [data-repwell-widget] attribute.
 */

import type { WidgetEntityOverride } from "../types";

const WIDGET_SELECTOR = "[data-repwell-widget]";

export interface DiscoveredWidget {
  element: HTMLElement;
  widgetId: string;
  entityOverride: WidgetEntityOverride | null;
}

function isEntityType(value: string | null): value is WidgetEntityOverride["entityType"] {
  return value === "user" || value === "branch" || value === "organization";
}

export function readEntityOverride(element: HTMLElement): WidgetEntityOverride | null {
  const entityType = element.getAttribute("data-repwell-entity-type");
  if (!isEntityType(entityType)) return null;

  const rawEntityId = element.getAttribute("data-repwell-entity-id");
  return {
    entityType,
    entityId: rawEntityId,
  };
}

export function discoverWidgets(): DiscoveredWidget[] {
  const elements = document.querySelectorAll<HTMLElement>(WIDGET_SELECTOR);
  const widgets: DiscoveredWidget[] = [];

  for (const element of elements) {
    // Skip elements that have already been initialized
    if (element.hasAttribute("data-repwell-initialized")) continue;

    const widgetId = element.getAttribute("data-repwell-widget");
    if (!widgetId) {
      console.warn("[RepWell] Element has data-repwell-widget but no value:", element);
      continue;
    }

    widgets.push({ element, widgetId, entityOverride: readEntityOverride(element) });
  }

  return widgets;
}
