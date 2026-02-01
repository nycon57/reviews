"use client";

import {
  Phone,
  Envelope as Mail,
  MapPin,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactCTACardProps {
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  className?: string;
}

export function ContactCTACard({
  phone,
  email,
  location,
  ctaText = "Get Started",
  ctaUrl,
  className,
}: ContactCTACardProps) {
  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-display text-repwell-teal-500">
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary CTA Button */}
        {ctaUrl && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              className="w-full bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white font-semibold"
              size="lg"
            >
              <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                {ctaText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        )}

        {/* Contact Details */}
        {location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-repwell-teal-300 mt-0.5" />
            <span className="text-sm text-repwell-teal-400">{location}</span>
          </div>
        )}

        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`tel:${phone}`}
              className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline transition-colors"
            >
              {phone}
            </a>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-repwell-teal-300" />
            <a
              href={`mailto:${email}`}
              className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline transition-colors break-all"
            >
              {email}
            </a>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex gap-2 pt-2">
          {phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </a>
            </Button>
          )}
          {email && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
