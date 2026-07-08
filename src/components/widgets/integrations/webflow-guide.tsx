"use client";

import { Globe } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const WEBFLOW_EMBED_CODE = `<script src="https://repwell.ai/embed.js" async></script>
<div
  data-repwell-widget="YOUR_WIDGET_ID"
  data-repwell-entity-type="user"
  data-repwell-entity-id="YOUR_ENTITY_ID"
></div>`;

const WEBFLOW_SITE_WIDE_SCRIPT = `<script src="https://repwell.ai/embed.js" async></script>`;

const WEBFLOW_SITE_WIDE_DIV = `<div
  data-repwell-widget="YOUR_WIDGET_ID"
  data-repwell-entity-type="user"
  data-repwell-entity-id="YOUR_ENTITY_ID"
></div>`;

const WEBFLOW_COLLECTION_CODE = `<div
  data-repwell-widget="YOUR_WIDGET_ID"
  data-repwell-entity-type="user"
  data-repwell-entity-id="{{wf {&quot;path&quot;:&quot;repwell-entity-id&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}"
></div>`;

export function WebflowGuide() {
  return (
    <IntegrationCard
      id="webflow"
      icon={<Globe size={20} className="text-heading" />}
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
                Replace the placeholder values with your Widget ID, entity type
                (<code className="text-xs bg-muted px-1 rounded">user</code>,{" "}
                <code className="text-xs bg-muted px-1 rounded">branch</code>, or{" "}
                <code className="text-xs bg-muted px-1 rounded">organization</code>),
                and entity ID from the RepWell dashboard.
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
            <Step number={2} title="Add the script to the footer">
              <p>
                Paste the embed.js script tag in the Footer Code section. This
                loads the script once, site-wide.
              </p>
              <CodeBlock code={WEBFLOW_SITE_WIDE_SCRIPT} language="html" />
            </Step>
            <Step number={3} title="Add widget containers per page">
              <p>
                On each page, add an Embed element with the widget div and all
                three data attributes:
              </p>
              <CodeBlock code={WEBFLOW_SITE_WIDE_DIV} language="html" />
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 3: Collection-Level Embedding
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Reuse one widget across CMS collection pages by binding the entity
            ID from a CMS field. Add the script tag site-wide (Method 2, Step
            2), then use this div in your collection template:
          </p>
          <CodeBlock code={WEBFLOW_COLLECTION_CODE} language="html" />
          <p className="text-xs text-muted-foreground mt-2">
            Set <code className="text-[11px] bg-muted px-1 rounded">data-repwell-entity-type</code>{" "}
            to match the entity stored in each CMS item. Bind{" "}
            <code className="text-[11px] bg-muted px-1 rounded">data-repwell-entity-id</code>{" "}
            to the CMS field containing the UUID.
          </p>
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
                "Webflow hosted sites generally allow third-party scripts in Embed elements. If using Webflow with a custom reverse proxy, ensure repwell.ai is allowed in your CSP.",
            },
            {
              problem: "Collection fields not populating",
              solution:
                "Verify the dynamic field binding syntax matches your CMS field name and that each collection item includes a valid RepWell entity UUID.",
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
