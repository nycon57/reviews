"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, cardHover, viewportOnce } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  /** Logo component or image URL */
  logo: React.ReactNode;
  /** Category for grouping */
  category?: "los" | "crm" | "reviews" | "marketing" | "automation";
}

interface IntegrationsGridProps {
  /** Section badge */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Custom integrations (uses defaults if not provided) */
  integrations?: Integration[];
  /** Additional className */
  className?: string;
}

// SVG logos for integrations (simplified brand representations)
const EncompassLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#0066CC" />
    <path d="M10 20h20M20 10v20" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ByteLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#00A86B" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
      B
    </text>
  </svg>
);

const SalesforceLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#00A1E0" />
    <circle cx="20" cy="18" r="8" fill="white" />
    <path d="M14 26c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="2" />
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#FFFFFF" className="stroke-gray-200" strokeWidth="1" />
    <path
      d="M29.6 20.2c0-.7-.1-1.4-.2-2H20v3.8h5.4c-.2 1.2-1 2.3-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3z"
      fill="#4285F4"
    />
    <path
      d="M20 30c2.7 0 5-0.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1h-3.3v2.6C12.5 27.6 16 30 20 30z"
      fill="#34A853"
    />
    <path
      d="M14.4 22c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2v-2.6h-3.3C10.4 16.6 10 18.3 10 20s.4 3.4 1.1 4.9l3.3-2.9z"
      fill="#FBBC05"
    />
    <path
      d="M20 13.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C24.9 10.9 22.7 10 20 10c-4 0-7.5 2.4-9 5.8l3.3 2.6c.8-2.3 3-4.5 5.7-4.5z"
      fill="#EA4335"
    />
  </svg>
);

const ZillowLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#006AFF" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
      Z
    </text>
  </svg>
);

const ZapierLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#FF4A00" />
    <path
      d="M20 12l-8 8 8 8 8-8-8-8zm0 4l4 4-4 4-4-4 4-4z"
      fill="white"
    />
  </svg>
);

const HubSpotLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#FF7A59" />
    <circle cx="20" cy="20" r="6" stroke="white" strokeWidth="2" fill="none" />
    <circle cx="20" cy="20" r="2" fill="white" />
  </svg>
);

const TotalExpertLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
    <rect width="40" height="40" rx="8" fill="#1E3A5F" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
      TE
    </text>
  </svg>
);

// Default integrations for RepWell
const defaultIntegrations: Integration[] = [
  {
    id: "encompass",
    name: "Encompass",
    description: "Sync loan data and automate survey triggers",
    logo: <EncompassLogo />,
    category: "los",
  },
  {
    id: "byte",
    name: "Byte Software",
    description: "BytePro integration for loan lifecycle events",
    logo: <ByteLogo />,
    category: "los",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM sync for contacts and campaign tracking",
    logo: <SalesforceLogo />,
    category: "crm",
  },
  {
    id: "google",
    name: "Google Business",
    description: "Publish reviews directly to Google",
    logo: <GoogleLogo />,
    category: "reviews",
  },
  {
    id: "zillow",
    name: "Zillow",
    description: "Syndicate reviews to Zillow profiles",
    logo: <ZillowLogo />,
    category: "reviews",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps with automation",
    logo: <ZapierLogo />,
    category: "automation",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing automation and lead nurturing",
    logo: <HubSpotLogo />,
    category: "marketing",
  },
  {
    id: "totalexpert",
    name: "Total Expert",
    description: "Mortgage marketing platform sync",
    logo: <TotalExpertLogo />,
    category: "marketing",
  },
];

// Integration card component
function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      className="group relative bg-white rounded-xl border border-repwell-sage-100 p-6 transition-all duration-200 hover:border-repwell-teal-300/50 hover:shadow-lg"
    >
      {/* Logo */}
      <div className="mb-4">{integration.logo}</div>

      {/* Name */}
      <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2 group-hover:text-repwell-teal-400 transition-colors">
        {integration.name}
      </h3>

      {/* Description */}
      <p className="font-sans text-sm text-repwell-teal-400 leading-relaxed">
        {integration.description}
      </p>

      {/* Subtle hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export function IntegrationsGrid({
  badge = "Integrations",
  heading = "Connect Your Existing Tools",
  subheading = "RepWell integrates seamlessly with the platforms your team already uses.",
  integrations = defaultIntegrations,
  className,
}: IntegrationsGridProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("py-16 md:py-24 lg:py-32 bg-white", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          {badge && (
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {heading && (
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
            >
              {heading}
            </motion.h2>
          )}

          {subheading && (
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* Integration cards grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </motion.div>

        {/* "And more" indicator */}
        <motion.div variants={fadeInUp} className="text-center mt-10">
          <p className="font-sans text-sm text-repwell-teal-400">
            Plus webhooks, API access, and custom integrations available
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
