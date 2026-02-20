"use client";

import { motion, type Variants } from "framer-motion";
import {
  LinkedinLogo,
  XLogo,
  Envelope,
  IdentificationBadge,
  ArrowRight,
} from "@phosphor-icons/react";
import { CopyLinkButton } from "./copy-link-button";
import { getInitials } from "@/lib/utils";

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
  destinationUrl: string | null;
  pageUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  emailUrl: string;
}

// ---- Animation Variants ----

const orchestrator: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const profStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
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
  destinationUrl,
  pageUrl,
  twitterUrl,
  linkedinUrl,
  emailUrl,
}: SmartLinkContentProps) {
  const profInitials = professional?.fullName
    ? getInitials(professional.fullName)
    : null;

  return (
    <motion.div
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 py-12"
      variants={orchestrator}
      initial="hidden"
      animate="visible"
    >
      <div className="flex w-full flex-col gap-5">
        {/* ── Accent bar ── */}
        <motion.div
          className="mx-auto h-1 w-16 rounded-full"
          style={{ backgroundColor: primaryColor, transformOrigin: "center" }}
          variants={barGrow}
        />

        {/* ── Professional section OR org fallback ── */}
        {professional ? (
          <motion.div
            className="flex flex-col items-center gap-3"
            variants={profStagger}
          >
            {/* Photo */}
            <motion.div variants={scaleIn}>
              {professional.photoUrl ? (
                <img
                  src={professional.photoUrl}
                  alt={professional.fullName}
                  className="h-20 w-20 rounded-full object-cover shadow-elevation-2"
                  style={{ border: `3px solid ${primaryColor}` }}
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-elevation-2"
                  style={{ background: primaryColor }}
                >
                  {profInitials}
                </div>
              )}
            </motion.div>

            {/* Name + details */}
            <motion.div className="text-center" variants={fadeUp}>
              <h1 className="font-display text-2xl text-repwell-teal-500 md:text-3xl">
                {professional.fullName}
              </h1>
              <div
                className="mx-auto mt-2 h-0.5 w-8 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <p className="mt-2 text-sm text-repwell-teal-300">
                {[professional.title, organizationName].filter(Boolean).join(" · ")}
              </p>
              {professional.nmlsId && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-repwell-sage-50 px-2.5 py-0.5 text-xs font-medium text-repwell-teal-400">
                  <IdentificationBadge className="h-3 w-3" weight="bold" />
                  NMLS# {professional.nmlsId}
                </span>
              )}
            </motion.div>

            {/* Rating summary */}
            {professional.averageRating != null &&
              professional.totalReviews != null &&
              professional.totalReviews > 0 && (
                <motion.div
                  className="flex items-center gap-2"
                  variants={fadeUp}
                >
                  <StarRating rating={professional.averageRating} size="sm" />
                  <span className="text-sm">
                    <span className="font-semibold text-repwell-teal-500">
                      {professional.averageRating.toFixed(1)}
                    </span>
                    <span className="text-repwell-teal-300">
                      {" · "}
                      {professional.totalReviews} review
                      {professional.totalReviews !== 1 ? "s" : ""}
                    </span>
                  </span>
                </motion.div>
              )}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-3"
            variants={fadeUp}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt={organizationName}
                className="h-10 w-auto object-contain"
              />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
              {organizationName}
            </span>
          </motion.div>
        )}

        {/* ── Review card with share row ── */}
        <motion.div
          className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-card"
          variants={fadeUp}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="p-6 md:p-8">
            {/* Quote */}
            {quote ? (
              <blockquote className="mb-5">
                <span className="block select-none font-display text-5xl leading-none text-repwell-sage-200/40">
                  &ldquo;
                </span>
                <p className="-mt-4 font-display text-xl italic leading-relaxed text-repwell-teal-500 md:text-2xl">
                  {quote}
                </p>
              </blockquote>
            ) : (
              <p className="mb-5 text-lg italic text-muted-foreground">
                {fallbackText}
              </p>
            )}

            {/* Divider */}
            <div className="mb-4 h-px bg-border" />

            {/* Stars for this review */}
            <div className="mb-3">
              <StarRating rating={rating} />
            </div>

            {/* Reviewer row */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-repwell-sage-100 text-xs font-semibold text-repwell-teal-400 ring-2 ring-repwell-sage-200">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-repwell-teal-500">
                  {customerName}
                </p>
                {sourcePlatform ? (
                  <p className="text-xs text-repwell-teal-300">
                    {sourceLabel}
                    {reviewDate ? ` · ${reviewDate}` : ""}
                  </p>
                ) : reviewDate ? (
                  <p className="text-xs text-repwell-teal-300">{reviewDate}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Share row — attached to card bottom */}
          <div className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5">
            <span className="mr-1 text-xs font-medium text-repwell-teal-300">
              Share
            </span>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={shareBtnClass}
              aria-label="Share on X"
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
            >
              <LinkedinLogo className="h-3.5 w-3.5" weight="bold" />
              <span className="text-xs font-medium">LinkedIn</span>
            </a>
            <a href={emailUrl} className={shareBtnClass} aria-label="Share via Email">
              <Envelope className="h-3.5 w-3.5" weight="bold" />
              <span className="text-xs font-medium">Email</span>
            </a>
            <CopyLinkButton url={pageUrl} />
          </div>
        </motion.div>

        {/* ── CTA button ── */}
        {destinationUrl && (
          <motion.div variants={fadeUp}>
            <motion.a
              href={ctaHref}
              className="block w-full rounded-xl py-4 text-center text-base font-semibold text-white"
              style={{ background: primaryColor }}
              animate={{
                boxShadow: [
                  `0 4px 14px -4px ${primaryColor}30`,
                  `0 4px 24px -4px ${primaryColor}55`,
                  `0 4px 14px -4px ${primaryColor}30`,
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                },
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
            >
              {ctaLabel}{" "}
              <ArrowRight className="ml-0.5 inline h-4 w-4" weight="bold" />
            </motion.a>
          </motion.div>
        )}

        {/* ── Org logo (secondary, when professional section shown) ── */}
        {professional && logoUrl && (
          <motion.div
            className="flex items-center justify-center gap-2"
            variants={fadeUp}
          >
            <img
              src={logoUrl}
              alt={organizationName}
              className="h-6 w-auto object-contain opacity-40"
            />
          </motion.div>
        )}

        {/* ── RepWell footer ── */}
        <motion.div className="pt-2 text-center" variants={fadeUp}>
          <div className="mx-auto mb-4 h-px w-12 bg-border" />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-col items-center gap-2"
          >
            <img
              src="/branding/RepWell-Logo-Full-Color.png"
              alt="RepWell"
              className="h-5 w-auto opacity-35 transition-opacity group-hover:opacity-60"
            />
            <span className="text-[11px] leading-tight text-repwell-teal-300/40 transition-colors group-hover:text-repwell-teal-300/70">
              Your reviews deserve this spotlight
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-repwell-teal-300/45 transition-colors group-hover:text-repwell-teal-400">
              Try RepWell free{" "}
              <ArrowRight className="h-3 w-3" weight="bold" />
            </span>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
