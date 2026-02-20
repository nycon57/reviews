"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChartBar,
  PaperPlaneRight,
  Star,
  Users,
  TrendUp,
  FileText,
  Plus,
  Gear,
  Lock,
  type IconProps,
} from "@phosphor-icons/react";

type PhosphorIcon = React.ComponentType<IconProps>;

// Icon map for server component compatibility
const iconMap: Record<string, PhosphorIcon> = {
  "bar-chart": ChartBar,
  send: PaperPlaneRight,
  star: Star,
  users: Users,
  "trending-up": TrendUp,
  "file-text": FileText,
  plus: Plus,
  settings: Gear,
  lock: Lock,
};

interface EmptyStateAction {
  label: string;
  href?: string;
  variant?: "default" | "outline" | "ghost";
  iconName?: string;
}

interface EmptyStateProps {
  iconName: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
}

// Server-compatible empty state (no animations, string icon names)
export function EmptyState({
  iconName,
  title,
  description,
  actions,
  className,
  compact = false,
}: EmptyStateProps) {
  const Icon = iconMap[iconName] || ChartBar;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-white via-white to-repwell-sage-100/30",
        compact ? "p-6" : "p-8 md:p-12",
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="empty-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#empty-pattern)" />
        </svg>
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Icon container */}
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10 shadow-sm",
            compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20"
          )}
        >
          <Icon
            weight="duotone"
            size={compact ? 28 : 40}
            className="text-repwell-teal-300"
          />
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-semibold text-repwell-teal-500",
            compact ? "text-base" : "text-lg md:text-xl"
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            "mt-2 text-repwell-teal-400 max-w-md",
            compact ? "text-sm" : "text-sm md:text-base"
          )}
        >
          {description}
        </p>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap justify-center gap-3",
              compact ? "mt-4" : "mt-6"
            )}
          >
            {actions.map((action, index) => {
              const ActionIcon = action.iconName ? iconMap[action.iconName] : undefined;
              const buttonContent = (
                <>
                  {ActionIcon && <ActionIcon size={16} className="mr-2" />}
                  {action.label}
                </>
              );

              return (
                <Button
                  key={index}
                  variant={action.variant || (index === 0 ? "default" : "outline")}
                  size={compact ? "sm" : "default"}
                  asChild
                >
                  <a href={action.href}>{buttonContent}</a>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact card variant for smaller spaces
interface EmptyStateCardProps {
  iconName: string;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyStateCard({
  iconName,
  title,
  description,
  action,
  className,
}: EmptyStateCardProps) {
  const Icon = iconMap[iconName] || ChartBar;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-repwell-sage-100/20 p-6 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon weight="duotone" size={24} className="text-repwell-teal-400" />
      </div>
      <h4 className="text-sm font-medium text-repwell-teal-500">{title}</h4>
      <p className="mt-1 text-xs text-repwell-teal-400 max-w-[200px]">{description}</p>
      {action && action.href && (
        <div className="mt-4">
          <Button variant={action.variant || "outline"} size="sm" asChild>
            <a href={action.href}>
              {action.iconName && iconMap[action.iconName] && (
                (() => {
                  const ActionIcon = iconMap[action.iconName];
                  return <ActionIcon size={14} className="mr-1.5" />;
                })()
              )}
              {action.label}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

// Welcome banner for new users
interface WelcomeBannerProps {
  userName?: string;
  completionPercent?: number;
  className?: string;
}

export function WelcomeBanner({
  userName,
  completionPercent = 0,
  className,
}: WelcomeBannerProps) {
  const steps = [
    { label: "Complete your profile", href: "/dashboard/settings", done: completionPercent > 25 },
    { label: "Send your first survey", href: "/dashboard/requests", done: false },
    { label: "Connect review sources", href: "/dashboard/settings#integrations", done: false },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-repwell-teal-300/20 bg-gradient-to-r from-repwell-teal-500 via-repwell-teal-500 to-repwell-teal-300 p-6 text-white",
        className
      )}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle cx="180" cy="20" r="80" fill="white" />
          <circle cx="220" cy="100" r="60" fill="white" />
        </svg>
      </div>

      <div className="relative">
        <h2 className="text-xl font-semibold">
          Welcome{userName ? `, ${userName}` : " to RepWell"}! 🎉
        </h2>
        <p className="mt-1 text-repwell-sage-100/90 text-sm">
          Let&apos;s get you set up to start collecting reviews and growing your reputation.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {steps.map((step, i) => (
            <a
              key={i}
              href={step.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                step.done
                  ? "bg-success/20 text-success"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  step.done ? "bg-success text-white" : "bg-white/20"
                )}
              >
                {step.done ? "✓" : i + 1}
              </span>
              {step.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
