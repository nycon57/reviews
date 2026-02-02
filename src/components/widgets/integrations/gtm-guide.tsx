"use client";

import { Tags } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const GTM_HTML_TAG = `<div data-repwell-widget="YOUR_WIDGET_ID"></div>`;

const GTM_SCRIPT_TAG = `<script src="https://app.repwell.com/embed.js" async></script>
<div data-repwell-widget="YOUR_WIDGET_ID"></div>`;

export function GtmGuide() {
  return (
    <IntegrationCard
      icon={<Tags size={20} className="text-repwell-teal-500" />}
      title="Google Tag Manager"
      description="Deploy the widget via GTM using a custom template or Custom HTML tag."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Option A: Custom HTML Tag (Recommended)
          </h4>
          <StepList>
            <Step number={1} title="Open Google Tag Manager">
              <p>Go to your GTM container and click Tags &rarr; New.</p>
            </Step>
            <Step number={2} title="Choose Custom HTML tag type">
              <p>Click Tag Configuration and select Custom HTML.</p>
            </Step>
            <Step number={3} title="Paste the embed code">
              <p>
                Replace <code className="text-xs bg-muted px-1 rounded">YOUR_WIDGET_ID</code> with
                your actual Widget ID from the RepWell dashboard.
              </p>
              <CodeBlock code={GTM_SCRIPT_TAG} language="html" />
            </Step>
            <Step number={4} title="Set a trigger">
              <p>
                Add a trigger for when the tag should fire. Choose one of:
              </p>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li><strong>DOM Ready</strong> — recommended for most sites</li>
                <li><strong>Page View</strong> — fires immediately on page load</li>
                <li><strong>Custom Event</strong> — fire on a specific dataLayer event</li>
              </ul>
            </Step>
            <Step number={5} title="Preview and publish">
              <p>
                Use GTM Preview mode to verify the widget renders. Once confirmed, publish the container.
              </p>
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Option B: RepWell GTM Template
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Download the RepWell GTM template file and import it into your
            container for a guided setup with built-in widget ID and trigger
            configuration fields.
          </p>
          <StepList>
            <Step number={1} title="Download the template">
              <p>
                Download{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  repwell-widget-template.tpl
                </code>{" "}
                from the button above or from Settings &rarr; Integrations.
              </p>
            </Step>
            <Step number={2} title="Import into GTM">
              <p>
                In GTM, go to Templates &rarr; Tag Templates &rarr; New &rarr;
                Import. Select the downloaded file.
              </p>
            </Step>
            <Step number={3} title="Create a tag from the template">
              <p>
                Go to Tags &rarr; New, select the RepWell Review Widget
                template, and enter your Widget ID.
              </p>
            </Step>
            <Step number={4} title="Add the widget container">
              <p>
                You still need a container element on the page. Add a separate
                Custom HTML tag with the widget div:
              </p>
              <CodeBlock code={GTM_HTML_TAG} language="html" />
            </Step>
          </StepList>
        </div>

        <TroubleshootingSection
          items={[
            {
              problem: "Widget does not appear after publishing",
              solution:
                "Verify the tag is firing in GTM Preview mode. Check that the widget container div is present on the page and the Widget ID matches.",
            },
            {
              problem: "Content Security Policy (CSP) blocks the script",
              solution:
                "Add app.repwell.com to your script-src and connect-src CSP directives, or use the iframe embed method instead.",
            },
            {
              problem: "Widget loads but shows no reviews",
              solution:
                "Ensure the widget is published (not draft) in the RepWell dashboard and the current domain is in the allowed domains list.",
            },
            {
              problem: "Tag fires multiple times",
              solution:
                "Set the tag to fire Once Per Page in the Advanced Settings of the tag configuration.",
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
