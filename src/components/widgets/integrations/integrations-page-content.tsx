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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Widget Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step-by-step guides for embedding RepWell widgets on any platform.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href="/gtm/repwell-widget-template.tpl" download>
            <Download size={14} />
            Download GTM Template
          </a>
        </Button>
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
            href="mailto:support@repwell.com"
            className="text-repwell-teal-500 underline underline-offset-2 hover:text-repwell-teal-600"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
