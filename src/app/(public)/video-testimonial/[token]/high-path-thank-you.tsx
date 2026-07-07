"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Check,
  Copy,
  FacebookLogo,
  GoogleLogo,
  LinkSimple,
  LinkedinLogo,
  ShareNetwork,
  SpinnerGap,
  XLogo,
  HouseLine,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { ContactCTACard } from "@/app/pro/[slug]/components/contact-cta-card";
import { ReferFriendModal } from "@/app/pro/[slug]/components/refer-friend-modal";
import { getShareKit, recordPassthroughClick } from "@/lib/video-testimonials/public-actions";
import type {
  PassthroughPlatform,
  PublicVideoTestimonialRequest,
  ShareKit,
} from "@/lib/video-testimonials/types";
import { Panel, firstName } from "./testimonial-shell";

const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 24; // 2 minutes

/** High-path thank-you screen: share, passthrough, contact, referral. */
export function HighPathThankYou({
  request,
  customerFirst,
  buttonStyle,
}: {
  request: PublicVideoTestimonialRequest;
  customerFirst: string;
  buttonStyle?: React.CSSProperties;
}) {
  const { professional, organization, token } = request;
  const proFirst = firstName(professional.fullName);

  const [kit, setKit] = useState<ShareKit | null>(null);
  const [referralOpen, setReferralOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // This screen only mounts client-side after submission, so navigator is safe to read.
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Poll the share kit until the caption and review draft are ready.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let polls = 0;

    const poll = async () => {
      try {
        const result = await getShareKit(token);
        if (cancelled) return;
        if (result.success && result.data) {
          setKit(result.data);
          if (result.data.status === "ready") return;
        }
      } catch (error) {
        console.error("Share kit poll failed:", error);
      }
      polls += 1;
      if (!cancelled && polls < MAX_POLLS) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const copyText = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
    }
  }, []);

  const ready = kit?.status === "ready";
  const smartLinkUrl = kit?.smartLinkUrl || null;
  const caption = kit?.caption || null;
  const smartLinkPendingApproval = kit?.smartLinkPendingApproval === true;
  const canShareContent = !!smartLinkUrl || !!caption;

  const handleNativeShare = useCallback(async () => {
    if (!smartLinkUrl && !caption) return;
    try {
      const shareData: { text: string; url?: string } = {
        text: caption || `I just shared my experience working with ${professional.fullName}.`,
      };
      if (smartLinkUrl) {
        shareData.url = smartLinkUrl;
      }
      await navigator.share(shareData);
    } catch (error) {
      // The customer closing the share sheet throws AbortError; that is fine.
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Native share failed:", error);
      }
    }
  }, [smartLinkUrl, caption, professional.fullName]);

  const handlePassthrough = (platform: PassthroughPlatform, url: string) => {
    if (kit?.reviewText) {
      copyText("review", kit.reviewText);
    }
    recordPassthroughClick(token, platform).catch((error) => {
      console.error("Failed to record passthrough click:", error);
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const encodedLink = smartLinkUrl ? encodeURIComponent(smartLinkUrl) : null;
  const encodedCaption = caption ? encodeURIComponent(caption) : null;
  const shareIntents = encodedLink
    ? [
        {
          label: "Facebook",
          icon: FacebookLogo,
          href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}${encodedCaption ? `&quote=${encodedCaption}` : ""}`,
        },
        {
          label: "LinkedIn",
          icon: LinkedinLogo,
          href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
        },
        {
          label: "X",
          icon: XLogo,
          href: `https://twitter.com/intent/tweet?url=${encodedLink}${encodedCaption ? `&text=${encodedCaption}` : ""}`,
        },
      ]
    : [];

  const showPassthrough = !!kit && (kit.googleReviewUrl || kit.zillowUrl);

  return (
    <div className="flex flex-1 animate-fade-in-up flex-col">
      {/* Celebration moment */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-7">
          <div
            aria-hidden
            className="absolute -right-3 -top-2 h-3 w-3 rotate-12 rounded-sm bg-repwell-sage-200/70"
          />
          <div
            aria-hidden
            className="absolute -bottom-1 -left-4 h-2.5 w-2.5 rounded-full bg-repwell-teal-300/50"
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-repwell-sage-100/60">
            <CheckCircle weight="fill" className="h-11 w-11 text-repwell-sage-200" />
          </div>
        </div>
        <h1 className="text-balance font-display text-4xl tracking-tight text-repwell-teal-500">
          Thank you, {customerFirst}.
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-sans text-base leading-relaxed text-repwell-teal-400">
          Your story is on its way to {professional.fullName}. While you&apos;re here, two easy
          ways to make it count twice.
        </p>
      </div>

      <div className="mt-10 space-y-5">
        {/* Share block */}
        <Panel className="p-6 text-left">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
            Share your story
          </p>

          {kit?.thumbnailUrl && (
            <img
              src={kit.thumbnailUrl}
              alt="A frame from your video"
              className="mt-4 w-full rounded-xl object-cover"
            />
          )}

          {ready && caption ? (
            <p className="mt-4 font-sans text-sm leading-relaxed text-repwell-teal-500">
              {caption}
            </p>
          ) : (
            <div className="mt-4 flex items-center gap-2.5">
              <SpinnerGap size={18} className="shrink-0 animate-spin text-repwell-teal-300" />
              <p className="font-sans text-sm text-repwell-teal-400">
                Writing your caption in your own words.
              </p>
            </div>
          )}

          {smartLinkPendingApproval && (
            <p className="mt-4 font-sans text-sm leading-relaxed text-repwell-teal-400">
              Your public share link will be available after {proFirst} reviews your video.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {canNativeShare ? (
              <Button
                type="button"
                className="gap-2"
                style={buttonStyle}
                disabled={!canShareContent}
                onClick={handleNativeShare}
              >
                <ShareNetwork weight="fill" className="h-4 w-4" />
                Share
              </Button>
            ) : (
              <>
                {shareIntents.map(({ label, icon: Icon, href }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                  >
                    <Icon weight="fill" className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </>
            )}
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!caption}
              onClick={() => caption && copyText("caption", caption)}
            >
              {copied === "caption" ? (
                <Check weight="bold" className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "caption" ? "Copied" : "Copy post copy"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!smartLinkUrl}
              onClick={() => smartLinkUrl && copyText("link", smartLinkUrl)}
            >
              {copied === "link" ? (
                <Check weight="bold" className="h-4 w-4" />
              ) : (
                <LinkSimple className="h-4 w-4" />
              )}
              {copied === "link" ? "Copied" : "Copy my link"}
            </Button>
          </div>
        </Panel>

        {/* Platform passthrough */}
        {showPassthrough && (
          <Panel className="p-6 text-left">
            <h2 className="font-display text-xl tracking-tight text-repwell-teal-500">
              Loved working with {proFirst}? Say it where it counts.
            </h2>
            <p className="mt-1.5 font-sans text-sm text-repwell-teal-400">
              We turned your video into a written review. Copy it, then post it in one tap.
            </p>

            {kit.reviewText ? (
              <figure className="mt-4 rounded-xl bg-repwell-sage-100/30 p-4">
                <blockquote className="font-sans text-sm leading-relaxed text-repwell-teal-500">
                  {kit.reviewText}
                </blockquote>
                <button
                  type="button"
                  onClick={() => copyText("review", kit.reviewText as string)}
                  className="mt-3 inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-repwell-teal-300 transition-colors hover:text-repwell-teal-400"
                >
                  {copied === "review" ? (
                    <Check weight="bold" size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied === "review" ? "Copied" : "Copy my review"}
                </button>
              </figure>
            ) : (
              <div className="mt-4 flex items-center gap-2.5">
                <SpinnerGap size={18} className="shrink-0 animate-spin text-repwell-teal-300" />
                <p className="font-sans text-sm text-repwell-teal-400">
                  Drafting your written review from the video now.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {kit.googleReviewUrl && (
                <Button
                  type="button"
                  className="gap-2"
                  style={buttonStyle}
                  onClick={() => handlePassthrough("google", kit.googleReviewUrl as string)}
                >
                  <GoogleLogo weight="bold" className="h-4 w-4" />
                  Post on Google
                </Button>
              )}
              {kit.zillowUrl && (
                <Button
                  type="button"
                  variant={kit.googleReviewUrl ? "outline" : "default"}
                  className="gap-2"
                  style={kit.googleReviewUrl ? undefined : buttonStyle}
                  onClick={() => handlePassthrough("zillow", kit.zillowUrl as string)}
                >
                  <HouseLine weight="duotone" className="h-4 w-4" />
                  Post on Zillow
                </Button>
              )}
            </div>
            <p className="mt-2.5 font-sans text-xs text-repwell-teal-300">
              We copy the review text for you, so you can paste it right in.
            </p>
          </Panel>
        )}

        {/* Contact card */}
        <ContactCTACard
          phone={professional.phone}
          address={professional.address}
          organization={{ name: organization.name, href: null }}
          professionalName={professional.fullName}
          ctaText={professional.ctaText ?? "Get Started"}
          ctaUrl={professional.ctaUrl}
          linkedinUrl={professional.linkedinUrl}
          facebookUrl={professional.facebookUrl}
          instagramUrl={professional.instagramUrl}
          twitterUrl={professional.twitterUrl}
          personalWebsiteUrl={professional.personalWebsiteUrl}
          zillowUrl={professional.zillowUrl}
        />

        {/* Referral */}
        <Panel className="flex flex-col items-start gap-3 p-6 text-left sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-sm text-repwell-teal-500">
            Know someone who could use {proFirst}? Make an introduction.
          </p>
          <Button type="button" variant="outline" onClick={() => setReferralOpen(true)}>
            Introduce a friend
          </Button>
        </Panel>
      </div>

      <ReferFriendModal
        open={referralOpen}
        onOpenChange={setReferralOpen}
        loanOfficerId={professional.id}
        loanOfficerName={professional.fullName}
      />
    </div>
  );
}
