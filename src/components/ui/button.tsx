import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-repwell-teal-300 text-white font-semibold hover:bg-repwell-teal-400 hover:-translate-y-0.5 hover:shadow-button-hover active:translate-y-0 active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-repwell-teal-300 bg-transparent text-repwell-teal-400 dark:text-repwell-sage-100/80 font-semibold hover:border-repwell-teal-400 hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10",
        secondary:
          "bg-surface-soft text-heading hover:bg-repwell-sage-200/50 dark:hover:bg-repwell-teal-300/20",
        ghost:
          "text-label hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 hover:text-repwell-teal-500 dark:hover:text-foreground",
        link: "text-repwell-teal-300 underline-offset-4 hover:underline hover:text-repwell-teal-400 dark:hover:text-repwell-teal-200",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 py-3 rounded-lg text-base",
        xl: "h-14 px-8 py-4 rounded-lg text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
