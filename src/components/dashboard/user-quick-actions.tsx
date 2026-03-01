"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  TrendUp as TrendingUp,
  ShareNetwork as Share2,
  PaperPlaneRight as Send,
  CaretRight,
} from "@phosphor-icons/react";
import { SendReviewRequestDialog } from "@/components/requests/send-review-request-dialog";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

export function UserQuickActions() {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

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
      href: "/dashboard/profile",
    },
  ];

  const cardClassName = "group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-soft transition-all hover:bg-repwell-sage-100/20 hover:border-repwell-teal-300/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const content = (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300 transition-colors group-hover:bg-repwell-teal-300/20">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-repwell-teal-500">{action.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {action.description}
                </div>
              </div>
              <CaretRight className="h-4 w-4 shrink-0 text-repwell-teal-300/40 transition-transform group-hover:translate-x-0.5 group-hover:text-repwell-teal-300" />
            </>
          );

          if (action.onClick) {
            return (
              <button
                key={action.title}
                type="button"
                onClick={action.onClick}
                className={`${cardClassName} w-full text-left`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={action.title} href={action.href!} className={cardClassName}>
              {content}
            </Link>
          );
        })}
      </div>

      <SendReviewRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={() => setRequestDialogOpen(false)}
      />
    </>
  );
}
