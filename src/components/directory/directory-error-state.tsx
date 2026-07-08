"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react";

interface DirectoryErrorStateProps {
  reset: () => void;
}

export function DirectoryErrorState({ reset }: DirectoryErrorStateProps) {
  return (
    <div className="bg-background">
      <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-gradient-to-b from-repwell-sage-100/20 to-transparent px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
            <WarningCircle weight="duotone" size={28} className="text-repwell-teal-300" />
          </div>
          <h1 className="font-display text-3xl font-bold text-repwell-teal-500">
            The directory did not load
          </h1>
          <p className="mt-3 font-sans text-base leading-relaxed text-repwell-teal-400">
            Something interrupted this search. Try again, or return to the full directory.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={reset}>
              <ArrowsClockwise size={16} />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/directory">Back to directory</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
