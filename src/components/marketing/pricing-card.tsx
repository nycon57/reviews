"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fadeInUp, scaleOnHover, tapAnimation } from "@/lib/motion";
import { Button } from "@/components/ui/button";
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
  className?: string;
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
  className,
}: PricingCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={scaleOnHover}
      whileTap={tapAnimation}
      className={cn("relative", className)}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            {badge}
          </span>
        </div>
      )}
      <Card
        className={cn(
          "h-full flex flex-col transition-colors",
          highlighted
            ? "border-primary shadow-lg scale-[1.02]"
            : "hover:border-primary/50"
        )}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{tier}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
          <div className="mt-4">
            <span className="text-4xl font-bold">
              {typeof price === "number" ? `$${price}` : price}
            </span>
            {typeof price === "number" && (
              <span className="text-muted-foreground">/{period}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Link href={cta.href} className="w-full">
            <Button
              className="w-full"
              variant={highlighted ? "default" : "outline"}
            >
              {cta.label}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
