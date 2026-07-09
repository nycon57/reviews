"use client";

import { createElement } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { scaleIn, staggerContainer, staggerContainerDelayed, fadeInUp } from "@/lib/motion";
import { getIconOrDefault } from "@/lib/icons/registry";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  iconName?: string;
  ariaLabel?: string;
}

interface EmptyStateProps {
  iconName: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
  animated?: boolean;
}

// Server-compatible empty state (no animations, string icon names)
export function EmptyState({
  iconName,
  title,
  description,
  actions,
  className,
  compact = false,
  animated = false,
}: EmptyStateProps) {
  const iconComponent = getIconOrDefault(iconName);

  const Wrapper = animated ? motion.div : "div";
  const ItemWrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? { variants: staggerContainer, initial: "hidden" as const, animate: "visible" as const }
    : {};
  const iconProps = animated ? { variants: scaleIn } : {};
  const itemProps = animated ? { variants: fadeInUp } : {};

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-repwell-sage-100/30 dark:to-repwell-teal-300/10",
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

      <Wrapper className="relative flex flex-col items-center text-center" {...wrapperProps}>
        {/* Icon container */}
        <ItemWrapper
          className={cn(
            "mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10 shadow-sm",
            compact ? "h-14 w-14" : "h-16 w-16 md:h-20 md:w-20"
          )}
          {...iconProps}
        >
          {createElement(iconComponent, {
            weight: "duotone",
            size: compact ? 28 : 40,
            className: "text-repwell-teal-300",
          })}
        </ItemWrapper>

        {/* Title */}
        <ItemWrapper {...itemProps}>
          <h3
            className={cn(
              "font-semibold text-heading",
              compact ? "text-base" : "text-lg md:text-xl"
            )}
          >
            {title}
          </h3>
        </ItemWrapper>

        {/* Description */}
        <ItemWrapper {...itemProps}>
          <p
            className={cn(
              "mt-2 text-label max-w-md",
              compact ? "text-sm" : "text-sm md:text-base"
            )}
          >
            {description}
          </p>
        </ItemWrapper>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <ItemWrapper
            className={cn(
              "flex flex-wrap justify-center gap-3",
              compact ? "mt-4" : "mt-6"
            )}
            {...itemProps}
          >
            {actions.map((action, index) => {
              const ActionIcon = action.iconName ? getIconOrDefault(action.iconName) : undefined;
              const buttonContent = (
                <>
                  {ActionIcon && <ActionIcon size={16} className="mr-2" />}
                  {action.label}
                </>
              );

              const variant = action.variant || (index === 0 ? "default" : "outline");
              const size = compact ? "sm" : "default";

              if (action.href) {
                return (
                  <Button key={index} variant={variant} size={size} asChild>
                    <a href={action.href} aria-label={action.ariaLabel}>
                      {buttonContent}
                    </a>
                  </Button>
                );
              }

              return (
                <Button
                  key={index}
                  type="button"
                  variant={variant}
                  size={size}
                  onClick={action.onClick}
                  aria-label={action.ariaLabel}
                >
                  {buttonContent}
                </Button>
              );
            })}
          </ItemWrapper>
        )}
      </Wrapper>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
  supportEmail?: string;
  supportLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "We couldn't load this section",
  description = "Something interrupted this view. Try again, or contact support if it keeps happening.",
  retry,
  retryLabel = "Try again",
  supportEmail = SUPPORT_EMAIL,
  supportLabel = "Contact support",
  className,
  compact = false,
}: ErrorStateProps) {
  const router = useRouter();
  const handleRetry = retry ?? (() => router.refresh());

  return (
    <EmptyState
      iconName="WarningCircle"
      title={title}
      description={description}
      compact={compact}
      className={className}
      actions={[
        {
          label: retryLabel,
          onClick: handleRetry,
          iconName: "ArrowsClockwise",
        },
        {
          label: supportLabel,
          href: `mailto:${supportEmail}`,
          variant: "outline",
          iconName: "Envelope",
        },
      ]}
    />
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
  const iconComponent = getIconOrDefault(iconName);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10 p-6 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow-sm">
        {createElement(iconComponent, {
          weight: "duotone",
          size: 24,
          className: "text-label",
        })}
      </div>
      <h4 className="text-sm font-medium text-heading">{title}</h4>
      <p className="mt-1 text-xs text-label max-w-[200px]">{description}</p>
      {action && action.href && (
        <div className="mt-4">
          <Button variant={action.variant || "outline"} size="sm" asChild>
            <a href={action.href}>
              {action.iconName && (() => {
                  const ActionIcon = getIconOrDefault(action.iconName);
                  return <ActionIcon size={14} className="mr-1.5" />;
                })()}
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
    { label: "Send your first review request", href: "/dashboard/reviews?tab=requests", done: false },
    { label: "Connect review sources", href: "/dashboard/organization?tab=integrations", done: false },
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

        <motion.div
          className="mt-5 flex flex-wrap gap-3"
          variants={staggerContainerDelayed}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, i) => (
            <motion.a
              key={i}
              href={step.href}
              variants={fadeInUp}
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
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
