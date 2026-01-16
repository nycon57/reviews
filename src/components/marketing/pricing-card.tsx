"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeInUp, cardHover, cardTap } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  tier: string;
  price: string | number;
  period?: string;
  description?: string;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  highlighted?: boolean;
  badge?: string;
  /** Savings text shown as pill badge */
  savings?: string;
  className?: string;
  /** Optional onClick handler for checkout flow */
  onSelect?: () => void;
  /** Whether checkout is in progress */
  isLoading?: boolean;
}

export function PricingCard({
  tier,
  price,
  period = "month",
  description,
  features,
  cta,
  highlighted = false,
  badge,
  savings,
  className,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={cardHover}
      whileTap={cardTap}
      className={cn("relative", className)}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge variant={highlighted ? "featured" : "outline"} className="px-4 py-1 shadow-md">
            {badge}
          </Badge>
        </div>
      )}
      <Card
        className={cn(
          "h-full flex flex-col transition-all duration-200",
          highlighted
            ? "border-repwell-teal-300 shadow-lg ring-2 ring-repwell-teal-300/20 scale-[1.02]"
            : "hover:border-repwell-teal-300/30"
        )}
      >
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-heading-md text-repwell-teal-500">{tier}</CardTitle>
          {description && (
            <CardDescription className="text-body-sm">{description}</CardDescription>
          )}
          <div className="mt-6 flex items-baseline justify-center gap-1">
            <span className="text-display-sm font-bold text-repwell-teal-500">
              {typeof price === "number" ? `$${price}` : price}
            </span>
            {typeof price === "number" && (
              <span className="text-body-md text-repwell-teal-400">/{period}</span>
            )}
          </div>
          {savings && (
            <div className="mt-2">
              <Badge variant="highlight" className="text-xs">
                {savings}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 pt-6">
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repwell-sage-100">
                  <Check className="h-3.5 w-3.5 text-repwell-teal-300" strokeWidth={3} />
                </div>
                <span className="text-body-sm text-repwell-teal-400">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-6">
          {onSelect ? (
            <Button
              className="w-full"
              size="lg"
              variant={highlighted ? "default" : "outline"}
              onClick={onSelect}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : cta.label}
            </Button>
          ) : (
            <Link href={cta.href} className="w-full">
              <Button
                className="w-full"
                size="lg"
                variant={highlighted ? "default" : "outline"}
              >
                {cta.label}
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
