"use client";

import { useState } from "react";
import {
  ShareNetwork,
  TwitterLogo as Twitter,
  FacebookLogo as Facebook,
  LinkedinLogo as Linkedin,
  Link as Link2,
  Check,
  EnvelopeSimple as Mail,
  X,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareProfileButtonProps {
  profileUrl: string;
  loanOfficerName: string;
  title?: string;
}

export function ShareProfileButton({
  profileUrl,
  loanOfficerName,
  title,
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const shareTitle = title || `${loanOfficerName} - Professional Profile`;
  const shareText = `Check out ${loanOfficerName}'s professional profile`;

  const encodedUrl = encodeURIComponent(profileUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
      setCopied(false);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
              >
                <ShareNetwork className="h-4 w-4 mr-1" />
                Share
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Share this profile</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem asChild>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Twitter className="h-4 w-4" />
              Share on Twitter
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Facebook className="h-4 w-4" />
              Share on Facebook
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Linkedin className="h-4 w-4" />
              Share on LinkedIn
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={shareLinks.email}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              Share via Email
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={copyToClipboard}
            className="flex items-center gap-2 cursor-pointer"
          >
            {copyError ? (
              <>
                <X className="h-4 w-4 text-red-500" />
                Copy failed
              </>
            ) : copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Copy Link
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
