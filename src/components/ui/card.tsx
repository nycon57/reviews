import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm dark:border-border dark:shadow-none",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const headerVariants = {
  default:
    "bg-gradient-to-r from-repwell-sage-100/40 to-transparent dark:from-repwell-teal-300/15 dark:to-transparent border-b border-border/50 rounded-t-xl",
  plain: "",
  "accent-amber":
    "bg-gradient-to-r from-warning/10 to-transparent border-b border-warning/20 rounded-t-xl",
  "accent-green":
    "bg-gradient-to-r from-success/10 to-transparent border-b border-success/20 rounded-t-xl",
};

type CardHeaderVariant = keyof typeof headerVariants;

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: CardHeaderVariant }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 px-6 py-4", headerVariants[variant], className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-heading-accent",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-body-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
