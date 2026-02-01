/**
 * Discovers widget placeholder elements on the page.
 * Looks for elements with [data-repwell-widget] attribute.
 */

const WIDGET_SELECTOR = "[data-repwell-widget]";

export interface DiscoveredWidget {
  element: HTMLElement;
  widgetId: string;
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

    widgets.push({ element, widgetId });
  }

  return widgets;
}
