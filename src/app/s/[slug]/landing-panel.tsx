"use client";

import { useState } from "react";
import {
  ArrowRight,
  FacebookLogo,
  GlobeSimple,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { ReferFriendModal } from "@/app/pro/[slug]/components/refer-friend-modal";
import { firstName } from "@/app/(public)/video-testimonial/[token]/testimonial-shell";
import { XIcon } from "@/components/icons/x-icon";
import { ZillowIcon } from "@/components/icons/zillow-icon";
import {
  formatAddressLines,
  getDisplayHostname,
  getSafeUrl,
} from "@/lib/contact-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SmartLinkProfessionalContact {
  id: string;
  fullName: string;
  phone: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  ctaText: string | null;
  ctaUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  personalWebsiteUrl: string | null;
  zillowUrl: string | null;
}

interface LandingPanelProps {
  contact: SmartLinkProfessionalContact;
  primaryColor?: string | null;
  className?: string;
}

function SmartLinkContactCard({ contact }: { contact: SmartLinkProfessionalContact }) {
  const addressLines = contact.address ? formatAddressLines(contact.address) : [];
  const safeCtaUrl = contact.ctaUrl ? getSafeUrl(contact.ctaUrl) : null;
  const safeLinkedinUrl = contact.linkedinUrl ? getSafeUrl(contact.linkedinUrl) : null;
  const safeFacebookUrl = contact.facebookUrl ? getSafeUrl(contact.facebookUrl) : null;
  const safeInstagramUrl = contact.instagramUrl ? getSafeUrl(contact.instagramUrl) : null;
  const safeTwitterUrl = contact.twitterUrl ? getSafeUrl(contact.twitterUrl) : null;
  const safePersonalWebsiteUrl = contact.personalWebsiteUrl
    ? getSafeUrl(contact.personalWebsiteUrl)
    : null;
  const safeZillowUrl = contact.zillowUrl ? getSafeUrl(contact.zillowUrl) : null;
  const hasSocialLinks =
    safeLinkedinUrl ||
    safeFacebookUrl ||
    safeInstagramUrl ||
    safeTwitterUrl ||
    safeZillowUrl;

  return (
    <Card className="border-t-4 border-t-repwell-sage-200">
      <CardHeader variant="plain" className="pb-0">
        <CardTitle className="font-display text-lg text-repwell-teal-500">
          Contact {firstName(contact.fullName)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeCtaUrl && (
          <Button
            asChild
            className="min-h-12 w-full bg-repwell-teal-300 font-semibold text-white hover:bg-repwell-teal-400 focus-visible:ring-repwell-teal-300"
            size="lg"
          >
            <a href={safeCtaUrl} target="_blank" rel="noopener noreferrer">
              {contact.ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        )}

        {addressLines.length > 0 && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-repwell-teal-300" />
            <address className="text-sm not-italic leading-relaxed text-repwell-teal-400">
              {addressLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < addressLines.length - 1 && <br />}
                </span>
              ))}
            </address>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex min-h-11 items-center rounded-lg text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
            >
              {contact.phone}
            </a>
          </div>
        )}

        {safePersonalWebsiteUrl && (
          <a
            href={safePersonalWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 rounded-lg text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
          >
            <GlobeSimple className="h-5 w-5 shrink-0" />
            <span className="truncate">{getDisplayHostname(safePersonalWebsiteUrl)}</span>
          </a>
        )}

        {hasSocialLinks && (
          <div className="flex flex-wrap items-center gap-2">
            {safeLinkedinUrl && (
              <a
                href={safeLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
              >
                <ZillowIcon className="h-6 w-6" />
              </a>
            )}
          </div>
        )}

        <div className="grid gap-2 pt-2">
          {contact.phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100 focus-visible:ring-repwell-teal-300"
            >
              <a href={`tel:${contact.phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Landing-page extras shown below the showcased review on /s/[slug] (both
 * text reviews and video testimonials): the professional's contact card plus
 * a one-line referral prompt. Only rendered when a public professional is
 * attached to the link.
 */
export function LandingPanel({ contact, primaryColor, className }: LandingPanelProps) {
  const [referOpen, setReferOpen] = useState(false);
  const proFirst = firstName(contact.fullName);
  const referLinkStyle = primaryColor ? { color: primaryColor } : undefined;

  return (
    <div
      className={
        className ??
        "mx-auto mt-8 w-full max-w-md space-y-5 motion-safe:animate-fade-in-up"
      }
    >
      <SmartLinkContactCard contact={contact} />

      <p className="text-center font-sans text-sm text-repwell-teal-400">
        Know someone who could use {proFirst}?{" "}
        <button
          type="button"
          onClick={() => setReferOpen(true)}
          style={referLinkStyle}
          className="inline-flex min-h-11 items-center rounded-lg px-1 font-semibold text-repwell-teal-500 underline underline-offset-2 transition-colors hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
        >
          Introduce them
        </button>
      </p>

      <ReferFriendModal
        open={referOpen}
        onOpenChange={setReferOpen}
        loanOfficerId={contact.id}
        loanOfficerName={contact.fullName}
      />
    </div>
  );
}
