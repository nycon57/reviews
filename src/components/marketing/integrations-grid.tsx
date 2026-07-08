"use client";

import * as React from "react";
import { motion } from "framer-motion";
import AutoScroll from "embla-carousel-auto-scroll";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import {
  SiZapier,
  SiFacebook,
  SiZillow,
  SiYelp,
  SiMailchimp,
} from "@icons-pack/react-simple-icons";

// Integration data type
interface Integration {
  id: string;
  name: string;
  category: string;
  logo: React.ReactNode;
}

// Multicolor Google "G" logo
const GoogleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("h-10 w-10", className)}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Multicolor Slack logo
const SlackLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 127 127" className={cn("h-10 w-10", className)}>
    <path
      d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"
      fill="#E01E5A"
    />
    <path
      d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"
      fill="#36C5F0"
    />
    <path
      d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"
      fill="#2EB67D"
    />
    <path
      d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"
      fill="#ECB22E"
    />
  </svg>
);

// LinkedIn logo (blue background + white "in" mark)
const LinkedInLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("h-10 w-10", className)}>
    <path
      d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill="#0A66C2"
    />
    <path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 110-4.128 2.064 2.064 0 010 4.128zm1.782 13.019H3.555V9h3.564v11.452z"
      fill="white"
    />
  </svg>
);

// Official Salesforce cloud logo
const SalesforceLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1000 700" className={cn("h-10 w-10", className)}>
    <path
      fill="#00A1E0"
      d="M416.224 76.763c32.219-33.57 77.074-54.391 126.682-54.391 65.946 0 123.48 36.772 154.12 91.361 26.626-11.896 56.098-18.514 87.106-18.514 118.94 0 215.368 97.268 215.368 217.247 0 119.993-96.428 217.261-215.368 217.261a213.735 213.735 0 0 1-42.422-4.227c-26.981 48.128-78.397 80.646-137.412 80.646-24.705 0-48.072-5.706-68.877-15.853-27.352 64.337-91.077 109.448-165.348 109.448-77.344 0-143.261-48.939-168.563-117.574-11.057 2.348-22.513 3.572-34.268 3.572C75.155 585.74.5 510.317.5 417.262c0-62.359 33.542-116.807 83.378-145.937-10.26-23.608-15.967-49.665-15.967-77.06C67.911 87.25 154.79.5 261.948.5c62.914 0 118.827 29.913 154.276 76.263"
    />
  </svg>
);

// Microsoft logo (4 colored squares)
const MicrosoftLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={cn("h-10 w-10", className)}>
    <rect x="4" y="4" width="15" height="15" fill="#F25022" />
    <rect x="21" y="4" width="15" height="15" fill="#7FBA00" />
    <rect x="4" y="21" width="15" height="15" fill="#00A4EF" />
    <rect x="21" y="21" width="15" height="15" fill="#FFB900" />
  </svg>
);

// All integrations
const integrations: Integration[] = [
  { id: "google", name: "Google", category: "Reviews", logo: <GoogleLogo /> },
  { id: "salesforce", name: "Salesforce", category: "CRM", logo: <SalesforceLogo /> },
  { id: "slack", name: "Slack", category: "Communication", logo: <SlackLogo /> },
  {
    id: "zillow",
    name: "Zillow",
    category: "Reviews",
    logo: <SiZillow className="h-10 w-10" color="#006AFF" />,
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    logo: <SiZapier className="h-10 w-10" color="#FF4A00" />,
  },
  { id: "linkedin", name: "LinkedIn", category: "Social", logo: <LinkedInLogo /> },
  {
    id: "yelp",
    name: "Yelp",
    category: "Reviews",
    logo: <SiYelp className="h-10 w-10" color="#D32323" />,
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "Social",
    logo: <SiFacebook className="h-10 w-10" color="#1877F2" />,
  },
  { id: "microsoft", name: "Microsoft", category: "Productivity", logo: <MicrosoftLogo /> },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    logo: <SiMailchimp className="h-10 w-10" color="#FFE01B" />,
  },
];

// Integration card component
function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="flex flex-col rounded-xl border border-repwell-sage-100 bg-white p-4 md:p-5">
      {integration.logo}
      <h3 className="mb-1 mt-4 font-semibold text-repwell-teal-500 md:text-lg">
        {integration.name}
      </h3>
      <p className="text-sm text-repwell-teal-400">{integration.category}</p>
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
      className={cn("bg-repwell-sage-50 py-16 md:py-24 lg:py-32", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left column - Text content */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left"
          >
            {badge && (
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 px-4 py-1.5 text-sm text-repwell-teal-400"
              >
                {badge}
              </Badge>
            )}

            {heading && (
              <h2 className="font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl lg:text-5xl">
                {heading}
              </h2>
            )}

            {subheading && (
              <p className="max-w-lg font-sans text-lg text-repwell-teal-400">{subheading}</p>
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
              className="pointer-events-none relative hidden lg:mt-12 lg:block"
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
