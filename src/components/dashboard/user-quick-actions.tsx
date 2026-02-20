"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  TrendUp as TrendingUp,
  ShareNetwork as Share2,
  PaperPlaneRight as Send,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

export function UserQuickActions() {
  const actions: QuickAction[] = [
    {
      icon: <Send className="h-5 w-5" />,
      title: "Send Survey",
      description: "Request a review from a customer",
      href: "/dashboard/distribution",
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {action.description}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
