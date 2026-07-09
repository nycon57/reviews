"use client";

import { WarningCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

interface PublicProfileErrorProps {
  reset: () => void;
  title?: string;
  message?: string;
}

export function PublicProfileError({
  reset,
  title = "We could not load this profile",
  message = "Something went wrong while loading the public profile. Please try again.",
}: PublicProfileErrorProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-sage-100/50">
          <WarningCircle weight="duotone" className="h-8 w-8 text-repwell-teal-300" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-repwell-teal-500">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-repwell-teal-400">{message}</p>
        <Button
          type="button"
          onClick={reset}
          className="mt-6 bg-repwell-teal-300 hover:bg-repwell-teal-400"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
