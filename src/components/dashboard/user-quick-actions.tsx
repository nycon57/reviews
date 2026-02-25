"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  TrendUp as TrendingUp,
  ShareNetwork as Share2,
  PaperPlaneRight as Send,
  CaretRight,
  Lightning as Zap,
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
    <Card className="shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Zap className="h-4 w-4 text-repwell-teal-300" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-all hover:bg-repwell-sage-100/20 hover:border-repwell-teal-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-repwell-teal-500">{action.title}</div>
              <div className="text-sm text-repwell-teal-400 truncate">
                {action.description}
              </div>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-repwell-teal-300/50" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
