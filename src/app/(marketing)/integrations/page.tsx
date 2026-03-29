import type { Metadata } from "next";
import { getAllIntegrations } from "@/config/integration-pages";
import { getBaseUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import {
  generateIntegrationListSchema,
  generateIntegrationIndexBreadcrumbs,
} from "@/lib/integrations/schema-generators";
import { IntegrationsDirectoryClient } from "./integrations-directory-client";

export const metadata: Metadata = {
  title: "Integrations & Connections | RepWell",
  description:
    "Connect RepWell with your favorite tools. Browse integrations for Salesforce, Google, Slack, HubSpot, Zapier, and more. Automate your review management workflow.",
  keywords: [
    "repwell integrations",
    "review management integrations",
    "crm integration",
    "google business integration",
    "salesforce reviews",
  ],
  openGraph: {
    title: "Integrations & Connections | RepWell",
    description:
      "Connect RepWell with your favorite tools. Browse integrations for Salesforce, Google, Slack, HubSpot, Zapier, and more.",
    type: "website",
    siteName: "RepWell",
  },
  twitter: {
    card: "summary_large_image",
    title: "Integrations & Connections | RepWell",
    description:
      "Connect RepWell with your favorite tools. Browse integrations for CRMs, review platforms, communication tools, and more.",
  },
};

export default function IntegrationsPage() {
  const integrations = getAllIntegrations();
  const baseUrl = getBaseUrl();

  return (
    <>
      <JsonLd data={generateIntegrationListSchema(integrations, baseUrl)} />
      <JsonLd data={generateIntegrationIndexBreadcrumbs(baseUrl)} />
      <IntegrationsDirectoryClient integrations={integrations} />
    </>
  );
}
