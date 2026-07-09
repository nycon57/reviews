"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

/**
 * Animated counter component that counts up when visible in viewport
 */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.round(latest).toLocaleString();
  });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, duration, count]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

interface AnimatedStatProps {
  value: string;
  label: string;
  className?: string;
}

/**
 * Parse a stat value and determine how to animate it
 * Handles numeric formats with optional prefixes, suffixes, and decimals.
 */
function parseStatValue(value: string): {
  number: number;
  prefix: string;
  suffix: string;
  decimals: number;
} {
  // Handle percentage
  if (value.includes("%")) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    return { number: num, prefix: "", suffix: "%", decimals: 0 };
  }

  // Handle fractional display values.
  if (value.includes("/")) {
    const [numPart] = value.split("/");
    const num = parseFloat(numPart.replace(/[^0-9.]/g, ""));
    const suffix = "/" + value.split("/")[1];
    return { number: num, prefix: "", suffix, decimals: 1 };
  }

  // Handle currency
  if (value.startsWith("$")) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    return {
      number: num,
      prefix: "$",
      suffix: value.includes("+") ? "+" : "",
      decimals: 0,
    };
  }

  // Handle numbers with + suffix
  if (value.includes("+")) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    return { number: num, prefix: "", suffix: "+", decimals: 0 };
  }

  // Default: just a number
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  const hasDecimal = value.includes(".");
  return {
    number: num || 0,
    prefix: "",
    suffix: "",
    decimals: hasDecimal ? 1 : 0,
  };
}

/**
 * Animated stat component that displays a value with its label
 * Automatically parses common stat formats
 */
export function AnimatedStat({ value, label, className }: AnimatedStatProps) {
  const parsed = parseStatValue(value);

  return (
    <div className={cn("text-center", className)}>
      <div className="text-3xl font-bold text-primary md:text-4xl">
        <AnimatedCounter
          value={parsed.number}
          prefix={parsed.prefix}
          suffix={parsed.suffix}
          decimals={parsed.decimals}
          duration={2}
        />
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
