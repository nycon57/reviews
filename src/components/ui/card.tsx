import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/60 bg-card text-card-foreground shadow-elevation-1 dark:border-border dark:shadow-none",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const headerVariants = {
  default:
    "bg-gradient-to-r from-repwell-sage-100/40 to-transparent dark:from-repwell-teal-300/15 dark:to-transparent border-b border-border/50 rounded-t-xl",
  plain: "",
  "accent-amber":
    "bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/30 dark:to-transparent border-b border-amber-200/30 dark:border-amber-800/30 rounded-t-xl",
  "accent-green":
    "bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/30 dark:to-transparent border-b border-green-200/30 dark:border-green-800/30 rounded-t-xl",
};

type CardHeaderVariant = keyof typeof headerVariants;

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: CardHeaderVariant }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1 px-6 py-4",
      headerVariants[variant],
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-lg font-semibold text-heading-accent leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-body-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
