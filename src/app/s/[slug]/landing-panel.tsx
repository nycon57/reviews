"use client";

import { useState } from "react";
import { ContactCTACard } from "@/app/pro/[slug]/components/contact-cta-card";
import { ReferFriendModal } from "@/app/pro/[slug]/components/refer-friend-modal";
import { firstName } from "@/app/(public)/video-testimonial/[token]/testimonial-shell";

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
    <div className={className ?? "mx-auto mt-8 w-full max-w-md space-y-5 animate-fade-in-up"}>
      <ContactCTACard
        phone={contact.phone}
        address={contact.address}
        professionalName={contact.fullName}
        ctaText={contact.ctaText}
        ctaUrl={contact.ctaUrl}
        linkedinUrl={contact.linkedinUrl}
        facebookUrl={contact.facebookUrl}
        instagramUrl={contact.instagramUrl}
        twitterUrl={contact.twitterUrl}
        personalWebsiteUrl={contact.personalWebsiteUrl}
        zillowUrl={contact.zillowUrl}
      />

      <p className="text-center font-sans text-sm text-repwell-teal-400">
        Know someone who could use {proFirst}?{" "}
        <button
          type="button"
          onClick={() => setReferOpen(true)}
          style={referLinkStyle}
          className="font-semibold text-repwell-teal-500 underline underline-offset-2 transition-colors hover:text-repwell-teal-400"
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
