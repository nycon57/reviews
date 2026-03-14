import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-xl",
  xl: "h-14 w-14 rounded-2xl",
} as const;

const BG_CLASSES = {
  subtle: "bg-repwell-sage-100/40 dark:bg-repwell-teal-300/15",
  soft: "bg-repwell-sage-100/50 dark:bg-repwell-teal-300/10",
  gradient:
    "bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10 dark:from-repwell-teal-300/15 dark:to-repwell-teal-300/5",
  dark: "bg-repwell-teal-300 text-white",
} as const;

export interface IconContainerProps {
  size?: keyof typeof SIZE_CLASSES;
  bg?: keyof typeof BG_CLASSES;
  className?: string;
  children: React.ReactNode;
}

export function IconContainer({
  size = "md",
  bg = "subtle",
  className,
  children,
}: IconContainerProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        SIZE_CLASSES[size],
        BG_CLASSES[bg],
        className
      )}
    >
      {children}
    </div>
  );
}
