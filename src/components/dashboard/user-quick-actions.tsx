"use client";

import { useState } from "react";
import { useRef } from "react";
import Link from "next/link";
import {
  Star,
  TrendUp as TrendingUp,
  ShareNetwork as Share2,
  PaperPlaneRight as Send,
  CaretRight,
  LinkedinLogo,
  XLogo,
  FacebookLogo,
  Link as LinkIcon,
  Check,
} from "@phosphor-icons/react";
import { IconContainer } from "@/components/shared";
import { SendReviewRequestDialog } from "@/components/requests/send-review-request-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrigin } from "@/hooks/use-origin";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  isShareProfile?: boolean;
}

interface UserQuickActionsProps {
  profileSlug: string | null;
  userName: string | null;
  userId?: string | null;
}

export function UserQuickActions({ profileSlug, userName, userId }: UserQuickActionsProps) {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const requestButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const profileUrl = origin && profileSlug ? `${origin}/pro/${profileSlug}` : null;

  const actions: QuickAction[] = [
    {
      icon: <Send className="h-5 w-5" />,
      title: "Send Review Request",
      description: "Request a review from a customer",
      onClick: () => setRequestDialogOpen(true),
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "View Reviews",
      description: "See all customer feedback",
      href: "/dashboard/reviews",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Analytics",
      description: "Track your performance metrics",
      href: "/dashboard/analytics",
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      title: "Share Profile",
      description: "View and share your public profile page",
      isShareProfile: true,
    },
  ];

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  };

  const shareText = encodeURIComponent(
    `Check out ${userName || "my"} professional profile`
  );
  const encodedUrl = profileUrl ? encodeURIComponent(profileUrl) : "";

  const cardClassName =
    "group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft transition-all hover:border-repwell-teal-300/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const content = (
            <>
              <IconContainer size="md" bg="subtle" className="text-repwell-teal-300 transition-colors group-hover:bg-repwell-teal-300/20">
                {action.icon}
              </IconContainer>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-heading">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {action.description}
                </div>
              </div>
              <CaretRight className="h-4 w-4 shrink-0 text-repwell-teal-300/40 transition-transform group-hover:translate-x-0.5 group-hover:text-repwell-teal-300" />
            </>
          );

          if (action.isShareProfile) {
            return (
              <DropdownMenu key={action.title}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`${cardClassName} w-full text-left`}
                    disabled={!profileUrl}
                  >
                    {content}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {!profileUrl ? (
                    <DropdownMenuItem disabled className="flex items-center gap-2 text-muted-foreground">
                      No public profile available
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <LinkedinLogo className="h-4 w-4" />
                          Share to LinkedIn
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <XLogo className="h-4 w-4" />
                          Share to X
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <FacebookLogo className="h-4 w-4" />
                          Share to Facebook
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <LinkIcon className="h-4 w-4" />
                            Copy Profile Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Share2 className="h-4 w-4" />
                          View Public Profile
                        </a>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          if (action.onClick) {
            return (
              <button
                key={action.title}
                ref={action.title === "Send Review Request" ? requestButtonRef : undefined}
                type="button"
                onClick={action.onClick}
                className={`${cardClassName} w-full text-left`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={action.title}
              href={action.href!}
              className={cardClassName}
            >
              {content}
            </Link>
          );
        })}
      </div>

      <SendReviewRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={() => setRequestDialogOpen(false)}
        currentUserId={userId}
        restoreFocusRef={requestButtonRef}
      />
    </>
  );
}
