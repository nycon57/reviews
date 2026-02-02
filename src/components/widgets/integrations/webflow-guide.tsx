"use client";

import { Globe } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const WEBFLOW_EMBED_CODE = `<script src="https://app.repwell.com/embed.js" async></script>
<div data-repwell-widget="YOUR_WIDGET_ID"></div>`;

const WEBFLOW_COLLECTION_CODE = `<script src="https://app.repwell.com/embed.js" async></script>
<div data-repwell-widget="YOUR_WIDGET_ID"
     data-repwell-lo="{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}">
</div>`;

export function WebflowGuide() {
  return (
    <IntegrationCard
      icon={<Globe size={20} className="text-repwell-teal-500" />}
      title="Webflow"
      description="Add review widgets to Webflow sites using Embed elements or Custom Code."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 1: Embed Element (Per-Page)
          </h4>
          <StepList>
            <Step number={1} title="Open the Webflow Designer">
              <p>Navigate to the page where you want the widget.</p>
            </Step>
            <Step number={2} title="Add an Embed element">
              <p>
                From the Add panel, drag an Embed (custom code) element onto
                your page where the widget should appear.
              </p>
            </Step>
            <Step number={3} title="Paste the embed code">
              <p>
                Replace{" "}
                <code className="text-xs bg-muted px-1 rounded">YOUR_WIDGET_ID</code>{" "}
                with your Widget ID.
              </p>
              <CodeBlock code={WEBFLOW_EMBED_CODE} language="html" />
            </Step>
            <Step number={4} title="Publish your site">
              <p>
                The widget will not render in the Webflow Designer preview. Publish
                your site to see it live.
              </p>
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 2: Site-Wide via Custom Code
          </h4>
          <StepList>
            <Step number={1} title="Go to Project Settings">
              <p>Open your Webflow project settings &rarr; Custom Code tab.</p>
            </Step>
            <Step number={2} title="Add the script to the head or footer">
              <p>
                Paste the embed.js script tag in the Footer Code section. Then
                place the widget div on each page using an Embed element.
              </p>
              <CodeBlock
                code={`<script src="https://app.repwell.com/embed.js" async></script>`}
                language="html"
              />
            </Step>
            <Step number={3} title="Add widget containers per page">
              <p>
                On each page, add an Embed element with just the widget div:
              </p>
              <CodeBlock
                code={`<div data-repwell-widget="YOUR_WIDGET_ID"></div>`}
                language="html"
              />
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 3: Collection-Level Embedding
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Display loan officer-specific widgets on CMS collection pages by
            passing dynamic data attributes.
          </p>
          <CodeBlock code={WEBFLOW_COLLECTION_CODE} language="html" />
        </div>

        <TroubleshootingSection
          items={[
            {
              problem: "Widget does not appear in Webflow Designer",
              solution:
                "Webflow's designer does not execute custom scripts. Publish your site or use the live preview to see the widget.",
            },
            {
              problem: "Widget is cut off or has wrong sizing",
              solution:
                "Ensure the Embed element's parent container has no overflow: hidden or fixed height that clips the widget.",
            },
            {
              problem: "Webflow CSP blocks the script",
              solution:
                "Webflow hosted sites generally allow third-party scripts in Embed elements. If using Webflow with a custom reverse proxy, ensure app.repwell.com is allowed in your CSP.",
            },
            {
              problem: "Collection fields not populating",
              solution:
                "Verify the dynamic field binding syntax matches your CMS collection field name. Check that the collection item has the field populated.",
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
