import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Brand variants
        highlight:
          "border-transparent bg-brand-amber text-black font-bold shadow-sm hover:shadow-md hover:scale-105",
        featured:
          "border-transparent bg-brand-iris text-white font-bold shadow-sm hover:shadow-md hover:scale-105",
        success:
          "border-transparent bg-brand-emerald text-white font-bold shadow-sm hover:shadow-md hover:scale-105",
        "brand-blue":
          "border-transparent bg-brand-blue text-white font-bold shadow-sm hover:shadow-md hover:scale-105",
        "brand-outline":
          "border-brand-silver bg-transparent text-brand-navy hover:border-brand-blue hover:text-brand-blue",
        "brand-subtle":
          "border-transparent bg-brand-frost text-brand-blue font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
