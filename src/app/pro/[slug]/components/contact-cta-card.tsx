"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Phone,
  ChatCircle,
  MapPin,
  ArrowRight,
  Buildings,
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  GlobeSimple,
  Envelope,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

import { ZillowIcon } from "@/components/icons/zillow-icon";
import {
  getSafeUrl,
  getDisplayHostname,
  formatAddressLines,
} from "@/lib/contact-display";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactCTACardProps {
  phone?: string | null;
  email?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  organization?: {
    name: string;
    /** null for individual accounts — renders plain text instead of link */
    href: string | null;
  } | null;
  branch?: {
    name: string;
    slug: string;
  } | null;
  professionalName?: string;
  /** Organization logo URL — displayed above the heading */
  logoUrl?: string | null;
  /** Override the "Contact {name}" heading — use when the full name should appear (e.g. org pages) */
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
  onMessage?: () => void;
  shareButton?: ReactNode;
  className?: string;
}

export function ContactCTACard({
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
  onMessage,
  shareButton,
  className,
}: ContactCTACardProps) {
  const addressLines = address ? formatAddressLines(address) : [];

  const safeCtaUrl = ctaUrl ? getSafeUrl(ctaUrl) : null;
  const safeDirectionsUrl = directionsUrl ? getSafeUrl(directionsUrl) : null;
  const safeLinkedinUrl = linkedinUrl ? getSafeUrl(linkedinUrl) : null;
  const safeFacebookUrl = facebookUrl ? getSafeUrl(facebookUrl) : null;
  const safeInstagramUrl = instagramUrl ? getSafeUrl(instagramUrl) : null;
  const safeTwitterUrl = twitterUrl ? getSafeUrl(twitterUrl) : null;
  const safePersonalWebsiteUrl = personalWebsiteUrl ? getSafeUrl(personalWebsiteUrl) : null;
  const safeZillowUrl = zillowUrl ? getSafeUrl(zillowUrl) : null;

  const hasSocialLinks = safeLinkedinUrl || safeFacebookUrl || safeInstagramUrl || safeTwitterUrl || safeZillowUrl;

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader variant="plain" className="pb-0">
        {logoUrl && (
          <div className="mb-2">
            <img
              src={logoUrl}
              alt={professionalName || "Logo"}
              className="w-full h-auto object-contain"
            />
          </div>
        )}
        <CardTitle className="text-lg font-display text-repwell-teal-500">
          {contactLabel || `Contact ${professionalName?.split(" ")[0] || "Information"}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary CTA Button */}
        {safeCtaUrl && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              className="w-full bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white font-semibold"
              size="lg"
            >
              <a href={safeCtaUrl} target="_blank" rel="noopener noreferrer">
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>
        )}

        {/* Organization — link for enterprise, plain text for individual */}
        {organization && (
          organization.href ? (
            <Link
              href={organization.href}
              className="flex items-center gap-3 group"
            >
              <Buildings
                weight="duotone"
                className="h-5 w-5 shrink-0 text-repwell-teal-300"
              />
              <span className="text-sm font-medium text-repwell-teal-400 group-hover:text-repwell-teal-300 transition-colors underline-offset-2 group-hover:underline">
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
          )
        )}

        {/* Full Address — links to branch page if available */}
        {addressLines.length > 0 && (
          branch ? (
            <Link
              href={`/branch/${branch.slug}`}
              className="flex items-start gap-3 group"
            >
              <MapPin className="h-5 w-5 shrink-0 text-repwell-teal-300 mt-0.5" />
              <address className="text-sm not-italic leading-relaxed">
                <span className="font-medium text-repwell-teal-400 group-hover:text-repwell-teal-300 group-hover:underline underline-offset-2 transition-colors">
                  {branch.name}
                </span>
                <br />
                <span className="text-repwell-teal-400">
                  {addressLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < addressLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </address>
            </Link>
          ) : (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-repwell-teal-300 mt-0.5" />
              <address className="text-sm text-repwell-teal-400 not-italic leading-relaxed">
                {addressLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < addressLines.length - 1 && <br />}
                  </span>
                ))}
              </address>
            </div>
          )
        )}

        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`tel:${phone}`}
              className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline transition-colors"
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
              className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline transition-colors break-all"
            >
              {email}
            </a>
          </div>
        )}

        {/* Personal website */}
        {safePersonalWebsiteUrl && (
          <a
            href={safePersonalWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
          >
            <GlobeSimple className="h-5 w-5 shrink-0" />
            <span className="truncate">{getDisplayHostname(safePersonalWebsiteUrl)}</span>
          </a>
        )}

        {/* Social icon row */}
        {hasSocialLinks && (
          <div className="flex items-center gap-3">
            {safeLinkedinUrl && (
              <a href={safeLinkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <LinkedinLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeFacebookUrl && (
              <a href={safeFacebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <FacebookLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeInstagramUrl && (
              <a href={safeInstagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <InstagramLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {safeTwitterUrl && (
              <a href={safeTwitterUrl} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <XIcon className="h-5 w-5" />
              </a>
            )}
            {safeZillowUrl && (
              <a href={safeZillowUrl} target="_blank" rel="noopener noreferrer" aria-label="Zillow" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <ZillowIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        )}

        {/* Quick Action Buttons */}
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
          {onMessage && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
              onClick={onMessage}
            >
              <ChatCircle className="h-4 w-4" />
              Message
            </Button>
          )}
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
          {shareButton}
        </div>
      </CardContent>
    </Card>
  );
}
