"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GtmGuide } from "./gtm-guide";
import { WebflowGuide } from "./webflow-guide";
import { SquarespaceGuide } from "./squarespace-guide";
import { ShopifyGuide } from "./shopify-guide";
import { IframeGuide } from "./iframe-guide";

export function IntegrationsPageContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Widget Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step-by-step guides for embedding RepWell widgets on any platform.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" asChild>
          <a href="/gtm/repwell-widget-template.tpl" download>
            <Download size={14} />
            Download GTM Template
          </a>
        </Button>
      </div>

      {/* Embed format reference */}
      <div className="rounded-lg border border-repwell-sage-200/60 bg-repwell-sage-100/20 dark:bg-repwell-teal-300/5 p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Embed Format
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Every RepWell script embed requires three data attributes: the widget ID
          (design contract), the entity type, and the entity ID (data contract).
          Copy the ready-to-use snippet from{" "}
          <span className="font-medium text-foreground">Widgets &rarr; General &rarr; Embed Code</span>{" "}
          — it includes all three values pre-filled.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-md border border-border/60 bg-background/80 p-3">
            <p className="text-[11px] font-semibold text-heading mb-0.5">
              data-repwell-widget
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your widget ID. Controls the design — theme, layout, and filters.
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/80 p-3">
            <p className="text-[11px] font-semibold text-heading mb-0.5">
              data-repwell-entity-type
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              One of <code className="text-[10px] bg-muted px-1 rounded">user</code>,{" "}
              <code className="text-[10px] bg-muted px-1 rounded">branch</code>, or{" "}
              <code className="text-[10px] bg-muted px-1 rounded">organization</code>.
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/80 p-3">
            <p className="text-[11px] font-semibold text-heading mb-0.5">
              data-repwell-entity-id
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The UUID of the entity whose reviews to display.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GtmGuide />
        <WebflowGuide />
        <SquarespaceGuide />
        <ShopifyGuide />
        <IframeGuide />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-medium text-foreground mb-1">
          Need help with a different platform?
        </h3>
        <p className="text-xs text-muted-foreground">
          Most platforms support either the script tag or iframe embed method.
          Check your platform&apos;s documentation for how to add custom HTML.
          If you need assistance,{" "}
          <a
            href="mailto:support@repwell.ai"
            className="text-heading underline underline-offset-2 hover:text-repwell-teal-600"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
