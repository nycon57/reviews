"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, cardHover, cardTap, featureIconHover } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  /** Optional accent color for top border */
  accentColor?: "blue" | "amber" | "emerald" | "iris" | "orchid" | "teal" | "sage";
  /** Icon background style */
  iconStyle?: "filled" | "outline" | "gradient";
  /** Card size variant */
  size?: "default" | "lg";
}

const accentColorMap = {
  blue: "before:bg-repwell-teal-300",
  amber: "before:bg-warning",
  emerald: "before:bg-success",
  iris: "before:bg-repwell-teal-300",
  orchid: "before:bg-repwell-sage-200",
  teal: "before:bg-gradient-to-r before:from-repwell-teal-300 before:to-repwell-sage-200",
  sage: "before:bg-gradient-to-r before:from-repwell-sage-200 before:to-repwell-teal-300",
};

const iconBgMap = {
  filled: "bg-repwell-sage-100 text-repwell-teal-300",
  outline: "bg-transparent border-2 border-border text-repwell-teal-300",
  gradient: "bg-gradient-to-br from-repwell-teal-300/10 to-repwell-teal-300/10 text-repwell-teal-300",
};

export function FeatureCard({
  icon,
  title,
  description,
  className,
  accentColor,
  iconStyle = "filled",
  size = "default",
}: FeatureCardProps) {
  const isLarge = size === "lg";

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      whileTap={cardTap}
      className="h-full hover:shadow-md transition-shadow duration-200"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-all duration-200",
          "hover:border-repwell-teal-300/30",
          accentColor && [
            "before:absolute before:top-0 before:left-0 before:right-0",
            isLarge ? "before:h-1.5" : "before:h-1",
            accentColorMap[accentColor],
          ],
          className
        )}
      >
        <CardHeader variant="plain" className={cn(isLarge ? "pb-6" : "pb-4")}>
          <motion.div
            whileHover={featureIconHover}
            className={cn(
              "mb-4 inline-flex items-center justify-center rounded-xl",
              isLarge ? "h-16 w-16" : "h-14 w-14",
              iconBgMap[iconStyle]
            )}
          >
            <div className={cn(isLarge ? "h-8 w-8" : "h-7 w-7")}>{icon}</div>
          </motion.div>
          <CardTitle
            className={cn(
              "text-repwell-teal-500",
              isLarge ? "text-heading-md" : "text-heading-sm"
            )}
          >
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={cn(
              "text-repwell-teal-400 leading-relaxed",
              isLarge ? "text-body-md" : "text-body-sm"
            )}
          >
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
