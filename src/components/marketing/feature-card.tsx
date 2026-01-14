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
  accentColor?: "blue" | "amber" | "emerald" | "iris" | "orchid";
  /** Icon background style */
  iconStyle?: "filled" | "outline" | "gradient";
}

const accentColorMap = {
  blue: "before:bg-brand-blue",
  amber: "before:bg-brand-amber",
  emerald: "before:bg-brand-emerald",
  iris: "before:bg-brand-iris",
  orchid: "before:bg-brand-orchid",
};

const iconBgMap = {
  filled: "bg-brand-frost text-brand-blue",
  outline: "bg-transparent border-2 border-brand-silver text-brand-blue",
  gradient: "bg-gradient-to-br from-brand-blue/10 to-brand-iris/10 text-brand-blue",
};

export function FeatureCard({
  icon,
  title,
  description,
  className,
  accentColor,
  iconStyle = "filled",
}: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      whileTap={cardTap}
      className="h-full"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-all duration-200",
          "hover:border-brand-blue/30",
          accentColor && [
            "before:absolute before:top-0 before:left-0 before:right-0 before:h-1",
            accentColorMap[accentColor],
          ],
          className
        )}
      >
        <CardHeader className="pb-4">
          <motion.div
            whileHover={featureIconHover}
            className={cn(
              "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl",
              iconBgMap[iconStyle]
            )}
          >
            <div className="h-7 w-7">{icon}</div>
          </motion.div>
          <CardTitle className="text-heading-sm text-brand-navy">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-brand-slate leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
