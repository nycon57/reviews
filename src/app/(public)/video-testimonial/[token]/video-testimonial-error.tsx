"use client";

import {
  WarningCircle as AlertCircle,
  Clock,
  CheckCircle,
  FileX,
  Prohibit as Ban,
} from "@phosphor-icons/react";

import { TestimonialShell } from "./testimonial-shell";

interface VideoTestimonialErrorProps {
  message: string;
}

export function VideoTestimonialError({ message }: VideoTestimonialErrorProps) {
  // Determine the error type and icon
  const getErrorDetails = () => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("expired")) {
      return {
        icon: Clock,
        title: "This link has expired",
        iconColor: "text-[#d4a574]",
        bgColor: "bg-[#d4a574]/10",
        helpText: "Reach out to the person who sent it and they can share a fresh one.",
      };
    }

    if (lowerMessage.includes("already been submitted") || lowerMessage.includes("submitted")) {
      return {
        icon: CheckCircle,
        title: "You're all done",
        iconColor: "text-repwell-sage-200",
        bgColor: "bg-repwell-sage-100/60",
        helpText: "Thank you! Your video testimonial has already been recorded.",
      };
    }

    if (lowerMessage.includes("cancelled")) {
      return {
        icon: Ban,
        title: "Request cancelled",
        iconColor: "text-repwell-teal-300",
        bgColor: "bg-repwell-sage-100/50",
        helpText: "This video testimonial request is no longer active.",
      };
    }

    if (lowerMessage.includes("not found") || lowerMessage.includes("invalid")) {
      return {
        icon: FileX,
        title: "We couldn't find that request",
        iconColor: "text-repwell-teal-300",
        bgColor: "bg-repwell-sage-100/50",
        helpText: "The link may be incorrect or the request may have been removed.",
      };
    }

    return {
      icon: AlertCircle,
      title: "Unable to load this request",
      iconColor: "text-[#c47c7c]",
      bgColor: "bg-[#c47c7c]/10",
      helpText: "Please try again later or contact support.",
    };
  };

  const { icon: Icon, title, iconColor, bgColor, helpText } = getErrorDetails();

  return (
    <TestimonialShell>
      <div className="flex flex-1 animate-fade-in flex-col items-center justify-center text-center">
        <div
          className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} ${iconColor}`}
        >
          <Icon weight="duotone" className="h-9 w-9" />
        </div>
        <h1 className="text-balance font-display text-3xl tracking-tight text-repwell-teal-500">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-repwell-teal-400">
          {message}
        </p>
        <p className="mx-auto mt-4 max-w-sm font-sans text-xs text-repwell-teal-300">{helpText}</p>
      </div>
    </TestimonialShell>
  );
}
