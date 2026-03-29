// JSON-LD schema generators for integration pages

import type { IntegrationPageConfig } from "./types";

/**
 * Generate SoftwareApplication JSON-LD for an integration detail page
 */
export function generateIntegrationSchema(
  config: IntegrationPageConfig,
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `RepWell ${config.name} Integration`,
    applicationCategory: "BusinessApplication",
    description: config.seo.description,
    url: `${baseUrl}/integrations/${config.slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Included with RepWell subscription",
    },
    operatingSystem: "Web",
    author: {
      "@type": "Organization",
      name: "RepWell",
      url: baseUrl,
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD for an integration detail page
 */
export function generateIntegrationBreadcrumbs(
  config: IntegrationPageConfig,
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Integrations",
        item: `${baseUrl}/integrations`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: config.name,
        item: `${baseUrl}/integrations/${config.slug}`,
      },
    ],
  };
}

/**
 * Generate ItemList JSON-LD for the integrations index page
 */
export function generateIntegrationListSchema(
  configs: IntegrationPageConfig[],
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "RepWell Integrations",
    description:
      "Browse all integrations available with RepWell's customer experience management platform.",
    numberOfItems: configs.length,
    itemListElement: configs.map((config, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: config.name,
      url: `${baseUrl}/integrations/${config.slug}`,
      description: config.shortDescription,
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD for the integrations index page
 */
export function generateIntegrationIndexBreadcrumbs(
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Integrations",
        item: `${baseUrl}/integrations`,
      },
    ],
  };
}
