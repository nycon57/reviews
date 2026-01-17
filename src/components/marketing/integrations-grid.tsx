"use client";

import * as React from "react";
import { motion } from "framer-motion";
import AutoScroll from "embla-carousel-auto-scroll";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import {
  SiGoogle,
  SiSalesforce,
  SiHubspot,
  SiZapier,
  SiSlack,
  SiFacebook,
} from "@icons-pack/react-simple-icons";

// Integration data type
interface Integration {
  id: string;
  name: string;
  category: string;
  logo: React.ReactNode;
}

// Custom SVG logos for integrations without simple-icons
const ZillowLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect width="40" height="40" rx="8" fill="#006AFF" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
      Z
    </text>
  </svg>
);

const EncompassLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect width="40" height="40" rx="8" fill="#0066CC" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
      ICE
    </text>
  </svg>
);

const ByteLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect width="40" height="40" rx="8" fill="#00A86B" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
      B
    </text>
  </svg>
);

const TotalExpertLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect width="40" height="40" rx="8" fill="#1E3A5F" />
    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
      TE
    </text>
  </svg>
);

const MicrosoftLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect x="4" y="4" width="15" height="15" fill="#F25022" />
    <rect x="21" y="4" width="15" height="15" fill="#7FBA00" />
    <rect x="4" y="21" width="15" height="15" fill="#00A4EF" />
    <rect x="21" y="21" width="15" height="15" fill="#FFB900" />
  </svg>
);

const LinkedInLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("w-10 h-10", className)}>
    <rect width="40" height="40" rx="8" fill="#0A66C2" />
    <path
      d="M13 16h-3v11h3V16zm-1.5-5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zM30 27h-3v-5.5c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.2-.1.5-.1.8V27h-3s.04-9 0-10h3v1.4c.4-.6 1.1-1.5 2.7-1.5 2 0 3.5 1.3 3.5 4.1V27h-.4z"
      fill="white"
    />
  </svg>
);

// All integrations
const integrations: Integration[] = [
  { id: "google", name: "Google", category: "Reviews", logo: <SiGoogle className="w-10 h-10" color="#4285F4" /> },
  { id: "salesforce", name: "Salesforce", category: "CRM", logo: <SiSalesforce className="w-10 h-10" color="#00A1E0" /> },
  { id: "slack", name: "Slack", category: "Communication", logo: <SiSlack className="w-10 h-10" color="#4A154B" /> },
  { id: "zillow", name: "Zillow", category: "Reviews", logo: <ZillowLogo /> },
  { id: "hubspot", name: "HubSpot", category: "Marketing", logo: <SiHubspot className="w-10 h-10" color="#FF7A59" /> },
  { id: "zapier", name: "Zapier", category: "Automation", logo: <SiZapier className="w-10 h-10" color="#FF4A00" /> },
  { id: "linkedin", name: "LinkedIn", category: "Social", logo: <LinkedInLogo /> },
  { id: "encompass", name: "Encompass", category: "LOS", logo: <EncompassLogo /> },
  { id: "facebook", name: "Facebook", category: "Social", logo: <SiFacebook className="w-10 h-10" color="#1877F2" /> },
  { id: "microsoft", name: "Microsoft", category: "Productivity", logo: <MicrosoftLogo /> },
  { id: "byte", name: "Byte Software", category: "LOS", logo: <ByteLogo /> },
  { id: "totalexpert", name: "Total Expert", category: "Marketing", logo: <TotalExpertLogo /> },
];

// Integration card component
function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="flex flex-col rounded-xl border border-repwell-sage-100 bg-white p-4 md:p-5">
      {integration.logo}
      <h3 className="mt-4 mb-1 font-semibold text-repwell-teal-500 md:text-lg">
        {integration.name}
      </h3>
      <p className="text-sm text-repwell-teal-400">
        {integration.category}
      </p>
    </div>
  );
}

interface IntegrationsGridProps {
  badge?: string;
  heading?: string;
  subheading?: string;
  className?: string;
}

export function IntegrationsGrid({
  badge = "Integrations",
  heading = "Connect Your Existing Tools",
  subheading = "RepWell integrates seamlessly with the platforms your team already uses.",
  className,
}: IntegrationsGridProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("py-16 md:py-24 lg:py-32 bg-repwell-sage-50", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:gap-20 lg:grid-cols-2">
          {/* Left column - Text content */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left"
          >
            {badge && (
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
              >
                {badge}
              </Badge>
            )}

            {heading && (
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500">
                {heading}
              </h2>
            )}

            {subheading && (
              <p className="font-sans text-lg text-repwell-teal-400 max-w-lg">
                {subheading}
              </p>
            )}

            <p className="font-sans text-sm text-repwell-teal-400">
              Plus webhooks, API access, and custom integrations available
            </p>
          </motion.div>

          {/* Right column - Scrolling carousels */}
          <motion.div variants={fadeInUp} className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {/* Mobile: Single carousel with all items */}
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              plugins={[
                AutoScroll({
                  speed: 0.7,
                  stopOnMouseEnter: true,
                }),
              ]}
              orientation="vertical"
              className="pointer-events-none relative lg:hidden"
            >
              <CarouselContent className="max-h-[500px]">
                {integrations.map((integration) => (
                  <CarouselItem key={integration.id}>
                    <IntegrationCard integration={integration} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-repwell-sage-50 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-repwell-sage-50 to-transparent" />
            </Carousel>

            {/* Desktop: First column (first half of integrations) */}
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              plugins={[
                AutoScroll({
                  speed: 0.7,
                  stopOnMouseEnter: true,
                }),
              ]}
              orientation="vertical"
              className="pointer-events-none relative hidden lg:block"
            >
              <CarouselContent className="max-h-[500px]">
                {integrations.slice(0, integrations.length / 2).map((integration) => (
                  <CarouselItem key={integration.id}>
                    <IntegrationCard integration={integration} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-repwell-sage-50 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-repwell-sage-50 to-transparent" />
            </Carousel>

            {/* Desktop: Second column (second half of integrations) - offset with mt-12 */}
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              plugins={[
                AutoScroll({
                  speed: 0.7,
                  stopOnMouseEnter: true,
                }),
              ]}
              orientation="vertical"
              className="pointer-events-none relative hidden lg:block lg:mt-12"
            >
              <CarouselContent className="max-h-[500px]">
                {integrations.slice(integrations.length / 2).map((integration) => (
                  <CarouselItem key={integration.id}>
                    <IntegrationCard integration={integration} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-repwell-sage-50 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-repwell-sage-50 to-transparent" />
            </Carousel>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
