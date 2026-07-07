"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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

// ---- Animation Variants ----

const orchestrator: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 18 },
  },
};

const barGrow: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

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
  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500";

// Tiered quote treatment: short quotes get the big display serif, mid-length
// quotes step down a size, and full-length reviews drop the serif entirely so
// the column never becomes a wall of italic.
const SHORT_QUOTE_CHARS = 180;
const MID_QUOTE_CHARS = 420;

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
        <span className="text-sm font-semibold uppercase tracking-wider text-repwell-teal-400">
          {organizationName}
        </span>
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
      <motion.div variants={scaleIn} className="shrink-0">
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
      </motion.div>

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
  reduceMotion,
}: {
  primaryAction: { label: string; href: string; external: boolean } | null;
  secondaryAction: { label: string; href: string } | null;
  contact: SmartLinkProfessionalContact | null;
  primaryColor: string;
  reduceMotion: boolean;
}) {
  const [referOpen, setReferOpen] = useState(false);

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
          <motion.a
            href={primaryAction.href}
            target={primaryAction.external ? "_blank" : undefined}
            rel={primaryAction.external ? "noopener noreferrer" : undefined}
            className="block w-full rounded-xl py-3.5 text-center text-base font-semibold text-white"
            style={{ background: primaryColor }}
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      `0 4px 14px -4px ${primaryColor}30`,
                      `0 4px 24px -4px ${primaryColor}55`,
                      `0 4px 14px -4px ${primaryColor}30`,
                    ],
                  }
            }
            transition={{
              boxShadow: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2,
              },
            }}
            whileHover={reduceMotion ? undefined : { scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.98 }}
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
          </motion.a>
        )}

        {secondaryAction && (
          <a
            href={secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl border border-repwell-teal-300 py-2.5 text-center text-sm font-semibold text-repwell-teal-400 transition-colors hover:bg-repwell-sage-100/40"
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
              className="text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline"
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
              className="truncate text-sm text-repwell-teal-400 transition-colors hover:text-repwell-teal-300 hover:underline"
            >
              {getDisplayHostname(websiteUrl)}
            </a>
          </ContactRow>
        )}

        {socials.length > 0 && (
          <div className="flex items-center gap-3 pt-0.5">
            {socials.map(({ url, label, icon }) => (
              <a
                key={label}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
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
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: primaryColor }}
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
  const reduceMotion = useReducedMotion();

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

      <motion.div
        className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
        variants={orchestrator}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        {/* Mobile stacks identity → quote → actions; desktop pins the quote as
            the left-hand hero with the identity + action rail alongside. */}
        <div className="grid grid-cols-1 gap-8 [grid-template-areas:'identity'_'quote'_'action'] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16 lg:gap-y-7 lg:[grid-template-areas:'quote_identity'_'quote_action']">
          {/* ── Quote (hero) ── */}
          <motion.figure className="min-w-0 [grid-area:quote] lg:self-center" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <motion.span
                aria-hidden
                className="h-0.5 w-8 rounded-full"
                style={{ backgroundColor: primaryColor, transformOrigin: "left" }}
                variants={barGrow}
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
          </motion.figure>

          {/* ── Identity rail ── */}
          <motion.div className="min-w-0 [grid-area:identity] lg:self-end" variants={fadeUp}>
            <IdentityBlock
              professional={professional}
              organizationName={organizationName}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
            />
          </motion.div>

          {/* ── Action rail ── */}
          <motion.div className="min-w-0 [grid-area:action] lg:self-start" variants={fadeUp}>
            <ActionPanel
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
              contact={contact ?? null}
              primaryColor={primaryColor}
              reduceMotion={Boolean(reduceMotion)}
            />
            {professional && logoUrl && (
              <div className="mt-5 flex justify-center lg:justify-start">
                {orgProfileUrl ? (
                  <a
                    href={orgProfileUrl}
                    className="inline-flex rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/40"
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
          </motion.div>
        </div>

        {/* ── RepWell footer ── */}
        <motion.div className="mt-12 lg:mt-14" variants={fadeUp}>
          <div className="mx-auto mb-5 h-px w-12 bg-border" />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mx-auto flex w-fit flex-col items-center gap-1.5 text-center"
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
        </motion.div>
      </motion.div>
    </div>
  );
}
