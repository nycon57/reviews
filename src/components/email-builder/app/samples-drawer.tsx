"use client";

import { Envelope } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { SidebarButton } from "./sidebar-button";
import type { TReaderDocument } from "@usewaypoint/email-builder";

export const SAMPLES_DRAWER_WIDTH = 240;

export interface SampleTemplate {
  label: string;
  document: TReaderDocument;
}

interface SamplesDrawerProps {
  open: boolean;
  samples: SampleTemplate[];
  onSelectSample: (document: TReaderDocument) => void;
  selectedLabel?: string;
}

export function SamplesDrawer({
  open,
  samples,
  onSelectSample,
  selectedLabel,
}: SamplesDrawerProps) {
  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-20 flex h-full flex-col border-r border-border bg-background transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ width: SAMPLES_DRAWER_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Envelope size={18} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Email Templates
        </h2>
      </div>

      {/* Sample list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {samples.map((sample) => (
            <SidebarButton
              key={sample.label}
              label={sample.label}
              active={selectedLabel === sample.label}
              onClick={() => onSelectSample(sample.document)}
            />
          ))}
        </div>

        {samples.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            No sample templates available.
          </p>
        )}
      </div>
    </div>
  );
}
