import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-repwell-teal-300 text-white hover:bg-repwell-teal-400",
        secondary:
          "border-transparent bg-repwell-sage-100 text-repwell-teal-500 hover:bg-repwell-sage-200/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "border-border bg-transparent text-repwell-teal-500 hover:border-repwell-teal-300 hover:text-repwell-teal-300",
        highlight:
          "border-transparent bg-warning text-warning-foreground font-bold shadow-sm hover:shadow-md hover:scale-105",
        featured:
          "border-transparent bg-repwell-teal-300 text-white font-bold shadow-sm hover:shadow-md hover:scale-105",
        success:
          "border-transparent bg-success text-success-foreground font-bold shadow-sm hover:shadow-md hover:scale-105",
        subtle:
          "border-transparent bg-repwell-sage-100 text-repwell-teal-300 font-medium",
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
