"use client";

import { useState } from "react";
import posthog from "posthog-js";
import {
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  XLogo,
  Envelope,
  IdentificationBadge,
  ArrowRight,
  Phone,
  MapPin,
  GlobeSimple,
} from "@phosphor-icons/react";
import { CopyLinkButton } from "./copy-link-button";
import { getInitials } from "@/lib/utils";
import { getSafeUrl, getDisplayHostname, formatAddressLines } from "@/lib/contact-display";
import { checkWcagContrast, getContrastRatio } from "@/lib/widgets/theme-utils";
import { ZillowIcon } from "@/components/icons/zillow-icon";
import { ReferFriendModal } from "@/app/pro/[slug]/components/refer-friend-modal";
import { firstName } from "@/app/(public)/video-testimonial/[token]/testimonial-shell";
import type { SmartLinkProfessionalContact } from "./landing-panel";

// ---- Types ----

export interface Professional {
  fullName: string;
  title: string | null;
  photoUrl: string | null;
  nmlsId: string | null;
  averageRating: number | null;
  totalReviews: number | null;
}

export interface SmartLinkContentProps {
  quote: string;
  fallbackText: string;
  customerName: string;
  initials: string;
  rating: number;
  sourceLabel: string;
  sourcePlatform: string;
  reviewDate: string | null;
  organizationName: string;
  logoUrl: string | null;
  primaryColor: string;
  professional: Professional | null;
  ctaLabel: string;
  ctaHref: string;
  /** The presenter's public RepWell profile; primary CTA target when present. */
  profileUrl: string | null;
  /** The org's public RepWell page; set only for enterprise accounts. Makes the org logo a link. */
  orgProfileUrl: string | null;
  destinationUrl: string | null;
  pageUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  emailUrl: string;
  /** Public contact fields for the presenting professional; renders the contact rail + referral prompt when present. */
  contact?: SmartLinkProfessionalContact | null;
}

// ---- Helpers ----

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const rounded = Math.round(rating);
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={cls} fill={i < rounded ? "#FBBF24" : "#e2e8e4"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

const shareBtnClass =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3.5 py-2 text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2";

// Tiered quote treatment: short quotes get the big display serif, mid-length
// quotes step down a size, and full-length reviews drop the serif entirely so
// the column never becomes a wall of italic.
const SHORT_QUOTE_CHARS = 180;
const MID_QUOTE_CHARS = 420;
const REPWELL_DEEP_TEAL = "#2f3e46";

function normalizeSafeBrandColor(primaryColor: string) {
  const ratio = getContrastRatio(primaryColor, "#ffffff");
  return ratio === null || !Number.isFinite(ratio) ? REPWELL_DEEP_TEAL : primaryColor;
}

function getAccessibleBrandFillStyle(primaryColor: string): React.CSSProperties {
  const brandColor = normalizeSafeBrandColor(primaryColor);

  if (checkWcagContrast("#ffffff", brandColor)?.passNormal) {
    return { background: brandColor, color: "#ffffff" };
  }

  if (checkWcagContrast(REPWELL_DEEP_TEAL, brandColor)?.passNormal) {
    return { background: brandColor, color: REPWELL_DEEP_TEAL };
  }

  return {
    background: `linear-gradient(rgba(47, 62, 70, 0.4), rgba(47, 62, 70, 0.4)), ${brandColor}`,
    color: "#ffffff",
  };
}

function getAccessibleAccentColor(primaryColor: string) {
  const brandColor = normalizeSafeBrandColor(primaryColor);
  return checkWcagContrast(brandColor, "#f7faf7")?.passNormal
    ? brandColor
    : REPWELL_DEEP_TEAL;
}

// ---- Sub-sections ----

function IdentityBlock({
  professional,
  organizationName,
  logoUrl,
  primaryColor,
}: {
  professional: Professional | null;
  organizationName: string;
  logoUrl: string | null;
  primaryColor: string;
}) {
  if (!professional) {
    return (
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={organizationName} className="h-10 w-auto object-contain" />
        ) : null}
        <h1 className="text-sm font-semibold uppercase tracking-wider text-repwell-teal-400">
          {organizationName}
        </h1>
      </div>
    );
  }

  const profInitials = getInitials(professional.fullName);
  const hasRating =
    professional.averageRating != null &&
    professional.totalReviews != null &&
    professional.totalReviews > 0;

  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0">
        {professional.photoUrl ? (
          <img
            src={professional.photoUrl}
            alt={professional.fullName}
            className="h-16 w-16 rounded-full object-cover shadow-elevation-2 lg:h-20 lg:w-20"
            style={{ border: `3px solid ${primaryColor}` }}
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white shadow-elevation-2 lg:h-20 lg:w-20"
            style={{ background: primaryColor }}
          >
            {profInitials}
          </div>
        )}
      </div>

      <div className="min-w-0 pt-0.5">
        <h1 className="font-display text-xl leading-tight text-repwell-teal-500 lg:text-2xl">
          {professional.fullName}
        </h1>
        <p className="mt-1 text-sm text-repwell-teal-300">
          {[professional.title, organizationName].filter(Boolean).join(" · ")}
        </p>
        {hasRating && (
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={professional.averageRating as number} size="sm" />
            <span className="text-sm">
              <span className="font-semibold text-repwell-teal-500">
                {(professional.averageRating as number).toFixed(1)}
              </span>
              <span className="text-repwell-teal-300">
                {" · "}
                {professional.totalReviews} review
                {professional.totalReviews !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        )}
        {professional.nmlsId && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-repwell-sage-50 px-2.5 py-0.5 text-xs font-medium text-repwell-teal-400">
            <IdentificationBadge className="h-3 w-3" weight="bold" />
            NMLS# {professional.nmlsId}
          </span>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-repwell-teal-300">{icon}</span>
      {children}
    </div>
  );
}

function ActionPanel({
  primaryAction,
  secondaryAction,
  contact,
  primaryColor,
}: {
  primaryAction: { label: string; href: string; external: boolean } | null;
  secondaryAction: { label: string; href: string } | null;
  contact: SmartLinkProfessionalContact | null;
  primaryColor: string;
}) {
  const [referOpen, setReferOpen] = useState(false);
  const accessibleBrandFillStyle = getAccessibleBrandFillStyle(primaryColor);
  const accessibleAccentColor = getAccessibleAccentColor(primaryColor);

  const addressLines = contact?.address ? formatAddressLines(contact.address) : [];
  const websiteUrl = getSafeUrl(contact?.personalWebsiteUrl);
  const socials = contact
    ? [
        { url: getSafeUrl(contact.linkedinUrl), label: "LinkedIn", icon: <LinkedinLogo className="h-5 w-5" weight="fill" /> },
        { url: getSafeUrl(contact.facebookUrl), label: "Facebook", icon: <FacebookLogo className="h-5 w-5" weight="fill" /> },
        { url: getSafeUrl(contact.instagramUrl), label: "Instagram", icon: <InstagramLogo className="h-5 w-5" weight="fill" /> },
        { url: getSafeUrl(contact.twitterUrl), label: "X", icon: <XLogo className="h-5 w-5" weight="fill" /> },
        { url: getSafeUrl(contact.zillowUrl), label: "Zillow", icon: <ZillowIcon className="h-5 w-5" /> },
      ].filter((s) => s.url)
    : [];

  const hasContactDetails =
    Boolean(contact?.phone) || addressLines.length > 0 || Boolean(websiteUrl) || socials.length > 0;

  if (!primaryAction && !secondaryAction && !hasContactDetails && !contact) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-soft">
      <div className="space-y-4 p-5 lg:p-6">
        {contact && (
          <p className="font-display text-lg text-repwell-teal-500">
            Work with {firstName(contact.fullName)}
          </p>
        )}

        {primaryAction && (
          <a
            href={primaryAction.href}
            target={primaryAction.external ? "_blank" : undefined}
            rel={primaryAction.external ? "noopener noreferrer" : undefined}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3.5 text-center text-base font-semibold transition-shadow hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
            style={accessibleBrandFillStyle}
            onClick={() =>
              posthog.capture("smart_link_cta_clicked", {
                cta_label: primaryAction.label,
                cta_href: primaryAction.href,
                cta_external: primaryAction.external,
              })
            }
          >
            {primaryAction.label}{" "}
            <ArrowRight className="ml-0.5 inline h-4 w-4" weight="bold" />
          </a>
        )}

        {secondaryAction && (
          <a
            href={secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-repwell-teal-300 px-4 py-2.5 text-center text-sm font-semibold text-repwell-teal-400 transition-colors hover:bg-repwell-sage-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
          >
            {secondaryAction.label}
          </a>
        )}

        {hasContactDetails && (primaryAction || secondaryAction) && (
          <div className="h-px bg-border" />
        )}

        {contact?.phone && (
          <ContactRow icon={<Phone className="h-[18px] w-[18px]" />}>
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex min-h-11 items-center rounded-lg text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
            >
              {contact.phone}
            </a>
          </ContactRow>
        )}

        {addressLines.length > 0 && (
          <ContactRow icon={<MapPin className="h-[18px] w-[18px]" />}>
            <address className="text-sm not-italic leading-relaxed text-repwell-teal-400">
              {addressLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < addressLines.length - 1 && <br />}
                </span>
              ))}
            </address>
          </ContactRow>
        )}

        {websiteUrl && (
          <ContactRow icon={<GlobeSimple className="h-[18px] w-[18px]" />}>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 max-w-full items-center rounded-lg text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
            >
              <span className="truncate">{getDisplayHostname(websiteUrl)}</span>
            </a>
          </ContactRow>
        )}

        {socials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {socials.map(({ url, label, icon }) => (
              <a
                key={label}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
              >
                {icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {contact && (
        <div className="border-t border-border bg-repwell-sage-50/50 px-5 py-3 lg:px-6">
          <p className="text-center text-sm text-repwell-teal-400">
            Know someone who could use {firstName(contact.fullName)}?{" "}
            <button
              type="button"
              onClick={() => {
                posthog.capture("referral_initiated", {
                  professional_id: contact.id,
                });
                setReferOpen(true);
              }}
              className="inline-flex min-h-11 items-center rounded-lg px-1 font-semibold underline underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
              style={{ color: accessibleAccentColor }}
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
      )}
    </div>
  );
}

// ---- Component ----

export function SmartLinkContent({
  quote,
  fallbackText,
  customerName,
  initials,
  rating,
  sourceLabel,
  sourcePlatform,
  reviewDate,
  organizationName,
  logoUrl,
  primaryColor,
  professional,
  ctaLabel,
  ctaHref,
  profileUrl,
  orgProfileUrl,
  destinationUrl,
  pageUrl,
  twitterUrl,
  linkedinUrl,
  emailUrl,
  contact,
}: SmartLinkContentProps) {
  const shortQuote = quote.length > 0 && quote.length <= SHORT_QUOTE_CHARS;
  const midQuote = quote.length > SHORT_QUOTE_CHARS && quote.length <= MID_QUOTE_CHARS;

  // The presenter's RepWell profile is the primary destination; fall back to the
  // tracked /go redirect, then to the professional's own contact CTA.
  const contactCtaUrl = getSafeUrl(contact?.ctaUrl);
  const primaryAction = profileUrl
    ? { label: ctaLabel, href: profileUrl, external: false }
    : destinationUrl
      ? { label: ctaLabel, href: ctaHref, external: false }
      : contactCtaUrl
        ? { label: contact?.ctaText || "Get started", href: contactCtaUrl, external: true }
        : null;
  const secondaryAction =
    destinationUrl && contactCtaUrl && contactCtaUrl !== getSafeUrl(destinationUrl)
      ? { label: contact?.ctaText || "Get started", href: contactCtaUrl }
      : null;

  const sourceMeta = [sourcePlatform ? sourceLabel : null, reviewDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#f7faf7]">
      {/* Atmosphere: soft sage wash + faint dot grid, same language as the
          recording flow so the whole testimonial family reads as one. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-repwell-sage-100/35 via-repwell-sage-100/10 to-transparent" />
        <div
          className="absolute inset-x-0 top-0 h-[420px] opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #84a98c 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-repwell-sage-200/10 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-repwell-teal-300/10 blur-3xl" />
      </div>

      <div
        className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        {/* Mobile stacks identity → quote → actions; desktop pins the quote as
            the left-hand hero with the identity + action rail alongside. */}
        <div className="grid grid-cols-1 gap-8 [grid-template-areas:'identity'_'quote'_'action'] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16 lg:gap-y-7 lg:[grid-template-areas:'quote_identity'_'quote_action']">
          {/* ── Quote (hero) ── */}
          <figure className="min-w-0 [grid-area:quote] lg:self-center">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-0.5 w-8 rounded-full"
                style={{ backgroundColor: primaryColor, transformOrigin: "left" }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-repwell-teal-300">
                Customer review
              </span>
            </div>

            <blockquote className="mt-5">
              <span
                aria-hidden
                className="block select-none font-display text-6xl leading-none text-repwell-sage-200/50 lg:text-7xl"
              >
                &ldquo;
              </span>
              {quote ? (
                shortQuote ? (
                  <p className="-mt-5 font-display text-2xl italic leading-relaxed text-repwell-teal-500 md:text-3xl lg:-mt-7 lg:text-4xl lg:leading-snug">
                    {quote}
                  </p>
                ) : midQuote ? (
                  <p className="-mt-5 font-display text-xl italic leading-relaxed text-repwell-teal-500 md:text-2xl lg:-mt-6">
                    {quote}
                  </p>
                ) : (
                  <p className="-mt-4 max-w-prose whitespace-pre-line font-sans text-base leading-relaxed text-repwell-teal-500 md:text-lg">
                    {quote}
                  </p>
                )
              ) : (
                <p className="-mt-5 font-display text-xl italic leading-relaxed text-repwell-teal-400">
                  {fallbackText}
                </p>
              )}
            </blockquote>

            <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-repwell-sage-100 text-xs font-semibold text-repwell-teal-400 ring-2 ring-repwell-sage-200">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-repwell-teal-500">{customerName}</p>
                  {sourceMeta && (
                    <p className="text-xs text-repwell-teal-300">{sourceMeta}</p>
                  )}
                </div>
              </div>
              <StarRating rating={rating} />
            </figcaption>

            {/* Share row */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              <span className="mr-1 text-xs font-medium text-repwell-teal-300">Share</span>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={shareBtnClass}
                aria-label="Share on X"
                onClick={() => posthog.capture("smart_link_shared", { channel: "x" })}
              >
                <XLogo className="h-3.5 w-3.5" weight="bold" />
                <span className="text-xs font-medium">X</span>
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={shareBtnClass}
                aria-label="Share on LinkedIn"
                onClick={() => posthog.capture("smart_link_shared", { channel: "linkedin" })}
              >
                <LinkedinLogo className="h-3.5 w-3.5" weight="bold" />
                <span className="text-xs font-medium">LinkedIn</span>
              </a>
              <a
                href={emailUrl}
                className={shareBtnClass}
                aria-label="Share via Email"
                onClick={() => posthog.capture("smart_link_shared", { channel: "email" })}
              >
                <Envelope className="h-3.5 w-3.5" weight="bold" />
                <span className="text-xs font-medium">Email</span>
              </a>
              <CopyLinkButton url={pageUrl} />
            </div>
          </figure>

          {/* ── Identity rail ── */}
          <div className="min-w-0 [grid-area:identity] lg:self-end">
            <IdentityBlock
              professional={professional}
              organizationName={organizationName}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
            />
          </div>

          {/* ── Action rail ── */}
          <div className="min-w-0 [grid-area:action] lg:self-start">
            <ActionPanel
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
              contact={contact ?? null}
              primaryColor={primaryColor}
            />
            {professional && logoUrl && (
              <div className="mt-5 flex justify-center lg:justify-start">
                {orgProfileUrl ? (
                  <a
                    href={orgProfileUrl}
                    className="inline-flex min-h-11 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/40 focus-visible:ring-offset-2"
                    aria-label={`View ${organizationName} on RepWell`}
                  >
                    <img
                      src={logoUrl}
                      alt={organizationName}
                      className="h-[6.25rem] w-auto object-contain"
                    />
                  </a>
                ) : (
                  <img
                    src={logoUrl}
                    alt={organizationName}
                    className="h-[6.25rem] w-auto object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RepWell footer ── */}
        <div className="mt-12 lg:mt-14">
          <div className="mx-auto mb-5 h-px w-12 bg-border" />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mx-auto flex min-h-11 w-fit flex-col items-center justify-center gap-1.5 rounded-lg px-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
          >
            <img
              src="/branding/RepWell-Logo-Full-Color.png"
              alt="RepWell"
              className="h-5 w-auto opacity-35 transition-opacity group-hover:opacity-60"
            />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-repwell-teal-300/45 transition-colors group-hover:text-repwell-teal-400">
              Your reviews deserve this spotlight. Try RepWell free{" "}
              <ArrowRight className="h-3 w-3" weight="bold" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
