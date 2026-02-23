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
  TwitterLogo,
  GlobeSimple,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactCTACardProps {
  phone?: string | null;
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

function getDisplayHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? parsed.pathname : "");
  } catch {
    return url;
  }
}

function formatAddress(address: NonNullable<ContactCTACardProps["address"]>) {
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityStateZip = [
    address.city,
    address.state ? `${address.state}${address.zip ? ` ${address.zip}` : ""}` : address.zip,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) lines.push(cityStateZip);
  return lines;
}

export function ContactCTACard({
  phone,
  address,
  organization,
  branch,
  professionalName,
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
  const addressLines = address ? formatAddress(address) : [];
  const hasSocialLinks = linkedinUrl || facebookUrl || instagramUrl || twitterUrl || zillowUrl;

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-display text-repwell-teal-500">
          Contact {professionalName?.split(" ")[0] || "Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary CTA Button */}
        {ctaUrl && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              className="w-full bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white font-semibold"
              size="lg"
            >
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
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

        {/* Personal website */}
        {personalWebsiteUrl && (
          <a
            href={personalWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
          >
            <GlobeSimple className="h-5 w-5 shrink-0" />
            <span className="truncate">{getDisplayHostname(personalWebsiteUrl)}</span>
          </a>
        )}

        {/* Social icon row */}
        {hasSocialLinks && (
          <div className="flex items-center gap-3">
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <LinkedinLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <FacebookLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <InstagramLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors">
                <TwitterLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {zillowUrl && (
              <a href={zillowUrl} target="_blank" rel="noopener noreferrer" aria-label="Zillow" className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors text-xs font-bold">
                Z
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
          {directionsUrl && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
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
