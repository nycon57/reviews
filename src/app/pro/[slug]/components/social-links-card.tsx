"use client";

import {
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  GlobeSimple,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SocialLinksCardProps {
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  personalWebsiteUrl?: string | null;
  zillowUrl?: string | null;
  /** Org-level social links as fallback */
  orgSocialLinks?: Record<string, string> | null;
}

function resolveLink(
  userVal: string | null | undefined,
  orgKey: string,
  orgLinks: Record<string, string> | null | undefined
): string | null {
  if (userVal) return userVal;
  return orgLinks?.[orgKey] ?? null;
}

function getDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? parsed.pathname : "");
  } catch {
    return url;
  }
}

export function SocialLinksCard({
  linkedinUrl,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  personalWebsiteUrl,
  zillowUrl,
  orgSocialLinks,
}: SocialLinksCardProps) {
  const linkedin = resolveLink(linkedinUrl, "linkedin_url", orgSocialLinks);
  const facebook = resolveLink(facebookUrl, "facebook_url", orgSocialLinks);
  const instagram = resolveLink(instagramUrl, "instagram_url", orgSocialLinks);
  const twitter = resolveLink(twitterUrl, "twitter_url", orgSocialLinks);
  const website = resolveLink(personalWebsiteUrl, "website_url", orgSocialLinks);

  const hasAny = linkedin || facebook || instagram || twitter || website || zillowUrl;
  if (!hasAny) return null;

  return (
    <Card className="border-t-4 border-t-repwell-sage-200">
      <CardHeader variant="plain" className="pb-2">
        <CardTitle className="text-lg font-display text-repwell-teal-500">
          Social &amp; Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Personal website — shown as readable URL */}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
          >
            <GlobeSimple className="h-5 w-5 shrink-0" />
            <span className="truncate flex-1">{getDisplayUrl(website)}</span>
            <ArrowSquareOut className="h-3.5 w-3.5 shrink-0" />
          </a>
        )}

        {/* Icon link row */}
        {(linkedin || facebook || instagram || twitter || zillowUrl) && (
          <div className="flex items-center gap-3 pt-1">
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
              >
                <LinkedinLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
              >
                <FacebookLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
              >
                <InstagramLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {twitter && (
              <a
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
              >
                <TwitterLogo className="h-6 w-6" weight="fill" />
              </a>
            )}
            {zillowUrl && (
              <a
                href={zillowUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zillow"
                className="text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors text-xs font-bold"
              >
                Z
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
