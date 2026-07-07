"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/**
 * Full-page atmospheric wrapper for the customer-facing testimonial flow.
 * Soft sage wash + faint dot grid so the page feels warm rather than clinical.
 */
export function TestimonialShell({
  children,
  statusMessage,
  footer,
  wide = false,
}: {
  children: React.ReactNode;
  statusMessage?: string;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#f7faf7]">
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-repwell-sage-100/35 via-repwell-sage-100/10 to-transparent" />
        <div
          className="absolute inset-x-0 top-0 h-[420px] opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #84a98c 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-repwell-sage-200/10 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-repwell-teal-300/10 blur-3xl" />
      </div>

      {/* ARIA live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <main
        className={cn(
          "relative mx-auto flex w-full flex-1 flex-col px-4 pb-10 pt-10 sm:pt-14",
          wide ? "max-w-2xl" : "max-w-xl"
        )}
      >
        {children}
      </main>

      <footer className="relative mx-auto w-full max-w-xl px-4 pb-8">
        {footer}
        <p className="text-center font-sans text-xs text-repwell-teal-300/80">
          Your video is only ever used with your permission.
        </p>
      </footer>
    </div>
  );
}

const STEPS = ["About you", "Record", "Done"] as const;

/** Three-step progress rail shown once the customer starts the flow. */
export function StepRail({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3;
          const done = step < current || current === 3;
          const active = step === current && current !== 3;
          return (
            <li key={label} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 h-px w-8 sm:w-12",
                    step <= current ? "bg-repwell-teal-300" : "bg-repwell-sage-100"
                  )}
                />
              )}
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-sans text-xs font-semibold transition-colors duration-200",
                    done && "bg-repwell-teal-300 text-white",
                    active && "bg-repwell-teal-500 text-white",
                    !done && !active && "border border-repwell-sage-100 bg-white text-repwell-teal-300"
                  )}
                >
                  {done ? <CheckCircle weight="fill" size={14} /> : step}
                </span>
                <span
                  className={cn(
                    "hidden font-sans text-xs font-medium sm:inline",
                    active || done ? "text-repwell-teal-500" : "text-repwell-teal-300/70"
                  )}
                >
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Compact "recording for" identity row used on inner steps. */
export function ProBadge({
  name,
  title,
  photoUrl,
  orgName,
}: {
  name: string;
  title: string | null;
  photoUrl: string | null;
  orgName: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-repwell-sage-200/60"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-repwell-sage-100/60 font-sans text-sm font-semibold text-repwell-teal-400">
          {name.charAt(0)}
        </div>
      )}
      <div className="text-left leading-tight">
        <p className="font-sans text-sm font-semibold text-repwell-teal-500">{name}</p>
        <p className="font-sans text-xs text-repwell-teal-300">
          {title ? `${title} · ${orgName}` : orgName}
        </p>
      </div>
    </div>
  );
}

/** White surface panel; the single card chrome used across the flow. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#e2e8e4] bg-white shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}
