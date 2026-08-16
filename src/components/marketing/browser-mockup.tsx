"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BrowserMockupProps {
  /** Content to display inside the browser frame */
  children: React.ReactNode;
  /** URL to display in address bar */
  url?: string;
  /** Visual style variant */
  variant?: "light" | "dark";
  /** Additional classes for the container */
  className?: string;
  /** Whether to show the address bar */
  showAddressBar?: boolean;
}

/**
 * Browser mockup component that wraps content in a browser chrome frame.
 * Used for displaying product screenshots and UI previews.
 */
export function BrowserMockup({
  children,
  url = "repwell.ai",
  variant = "light",
  className,
  showAddressBar = true,
}: BrowserMockupProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shadow-2xl",
        isDark ? "bg-repwell-teal-500" : "bg-white",
        "border",
        isDark ? "border-repwell-teal-400" : "border-border",
        className
      )}
    >
      {/* Browser chrome header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          isDark
            ? "bg-repwell-teal-500 border-b border-repwell-teal-400"
            : "bg-repwell-sage-100/50 border-b border-border"
        )}
      >
        {/* Traffic light buttons */}
        <div className="flex gap-1.5">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isDark ? "bg-repwell-sage-200/40" : "bg-repwell-sage-200/60"
            )}
          />
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isDark ? "bg-repwell-sage-200/40" : "bg-repwell-sage-200/60"
            )}
          />
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isDark ? "bg-repwell-sage-200/40" : "bg-repwell-sage-200/60"
            )}
          />
        </div>

        {/* Address bar */}
        {showAddressBar && (
          <div
            className={cn(
              "flex-1 ml-2 px-4 py-1.5 rounded-md text-xs",
              isDark
                ? "bg-repwell-teal-400/50 text-repwell-sage-100/70"
                : "bg-white text-repwell-teal-300"
            )}
          >
            {url}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className={cn(isDark ? "bg-repwell-teal-500" : "bg-white")}>
        {children}
      </div>
    </div>
  );
}
