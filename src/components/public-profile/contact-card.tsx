import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Buildings,
  Envelope,
  FacebookLogo,
  GlobeSimple,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react/dist/ssr";

import { ZillowIcon } from "@/components/icons/zillow-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAddressLines,
  getDisplayHostname,
  getSafeUrl,
} from "@/lib/contact-display";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface PublicProfileContactCardProps {
  phone?: string | null;
  email?: string | null;
  address?: Address | null;
  organization?: {
    name: string;
    href: string | null;
  } | null;
  branch?: {
    name: string;
    slug: string;
  } | null;
  professionalName?: string;
  logoUrl?: string | null;
  contactLabel?: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
  directionsUrl?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  personalWebsiteUrl?: string | null;
  zillowUrl?: string | null;
  messageAction?: ReactNode;
  shareAction?: ReactNode;
  className?: string;
}

export function PublicProfileContactCard({
  phone,
  email,
  address,
  organization,
  branch,
  professionalName,
  logoUrl,
  contactLabel,
  ctaText = "Get Started",
  ctaUrl,
  directionsUrl,
  linkedinUrl,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  personalWebsiteUrl,
  zillowUrl,
  messageAction,
  shareAction,
  className,
}: PublicProfileContactCardProps) {
  const addressLines = address ? formatAddressLines(address) : [];

  const safeCtaUrl = ctaUrl ? getSafeUrl(ctaUrl) : null;
  const safeDirectionsUrl = directionsUrl ? getSafeUrl(directionsUrl) : null;
  const safeLinkedinUrl = linkedinUrl ? getSafeUrl(linkedinUrl) : null;
  const safeFacebookUrl = facebookUrl ? getSafeUrl(facebookUrl) : null;
  const safeInstagramUrl = instagramUrl ? getSafeUrl(instagramUrl) : null;
  const safeTwitterUrl = twitterUrl ? getSafeUrl(twitterUrl) : null;
  const safePersonalWebsiteUrl = personalWebsiteUrl
    ? getSafeUrl(personalWebsiteUrl)
    : null;
  const safeZillowUrl = zillowUrl ? getSafeUrl(zillowUrl) : null;

  const hasSocialLinks =
    safeLinkedinUrl ||
    safeFacebookUrl ||
    safeInstagramUrl ||
    safeTwitterUrl ||
    safeZillowUrl;

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader variant="plain" className="pb-0">
        {logoUrl && (
          <div className="mb-2">
            <img
              src={logoUrl}
              alt={professionalName || "Logo"}
              className="h-auto w-full object-contain"
            />
          </div>
        )}
        <CardTitle className="text-lg font-display text-repwell-teal-500">
          {contactLabel ||
            `Contact ${professionalName?.split(" ")[0] || "Information"}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeCtaUrl && (
          <Button
            asChild
            className="w-full bg-repwell-teal-300 font-semibold text-white hover:bg-repwell-teal-400"
            size="lg"
          >
            <a href={safeCtaUrl} target="_blank" rel="noopener noreferrer">
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        )}

        {organization &&
          (organization.href ? (
            <Link href={organization.href} className="group flex items-center gap-3">
              <Buildings
                weight="duotone"
                className="h-5 w-5 shrink-0 text-repwell-teal-300"
              />
              <span className="text-sm font-medium text-repwell-teal-400 underline-offset-2 transition-colors group-hover:text-repwell-teal-300 group-hover:underline">
                {organization.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Buildings
                weight="duotone"
                className="h-5 w-5 shrink-0 text-repwell-teal-300"
              />
              <span className="text-sm font-medium text-repwell-teal-400">
                {organization.name}
              </span>
            </div>
          ))}

        {addressLines.length > 0 &&
          (branch ? (
            <Link
              href={`/branch/${branch.slug}`}
              className="group flex items-start gap-3"
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-repwell-teal-300" />
              <address className="text-sm not-italic leading-relaxed">
                <span className="font-medium text-repwell-teal-400 underline-offset-2 transition-colors group-hover:text-repwell-teal-300 group-hover:underline">
                  {branch.name}
                </span>
                <br />
                <span className="text-repwell-teal-400">
                  {addressLines.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < addressLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </address>
            </Link>
          ) : (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-repwell-teal-300" />
              <address className="text-sm not-italic leading-relaxed text-repwell-teal-400">
                {addressLines.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < addressLines.length - 1 && <br />}
                  </span>
                ))}
              </address>
            </div>
          ))}

        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`tel:${phone}`}
              className="text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline"
            >
              {phone}
            </a>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-3">
            <Envelope className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`mailto:${email}`}
              className="break-all text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline"
            >
              {email}
            </a>
          </div>
        )}

        {safePersonalWebsiteUrl && (
          <a
            href={safePersonalWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
          >
            <GlobeSimple className="h-5 w-5 shrink-0" />
            <span className="truncate">
              {getDisplayHostname(safePersonalWebsiteUrl)}
            </span>
          </a>
        )}

        {hasSocialLinks && (
          <div className="flex items-center gap-3">
            {safeLinkedinUrl && (
              <a
                href={safeLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
              >
                <LinkedinLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeFacebookUrl && (
              <a
                href={safeFacebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
              >
                <FacebookLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeInstagramUrl && (
              <a
                href={safeInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
              >
                <InstagramLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeTwitterUrl && (
              <a
                href={safeTwitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
              >
                <XIcon className="h-5 w-5" />
              </a>
            )}
            {safeZillowUrl && (
              <a
                href={safeZillowUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zillow"
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
              >
                <ZillowIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        )}

        <div className="grid gap-2 pt-2">
          {phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          {messageAction}
          {safeDirectionsUrl && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <a href={safeDirectionsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" />
                Get Directions
              </a>
            </Button>
          )}
          {shareAction}
        </div>
      </CardContent>
    </Card>
  );
}
