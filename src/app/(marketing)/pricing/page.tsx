import type { Metadata } from "next";
import { PricingPageClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | ReviewHub - Simple, Transparent Plans",
  description:
    "Choose the ReviewHub plan that fits your needs. From individual loan officers to enterprise teams, we have a solution for you. Start your free 14-day trial today.",
  openGraph: {
    title: "Pricing | ReviewHub",
    description:
      "Simple, transparent pricing for customer experience management. Start free.",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
