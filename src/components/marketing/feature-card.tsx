"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, scaleOnHover, tapAnimation } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={scaleOnHover}
      whileTap={tapAnimation}
    >
      <Card
        className={cn(
          "h-full transition-colors hover:border-primary/50",
          className
        )}
      >
        <CardHeader>
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
