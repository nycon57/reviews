"use client";

import { LayoutGrid } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const SQUARESPACE_HEADER_SCRIPT = `<script src="https://repwell.ai/embed.js" async></script>`;

const SQUARESPACE_CODE_BLOCK = `<div
  data-repwell-widget="YOUR_WIDGET_ID"
  data-repwell-entity-type="user"
  data-repwell-entity-id="YOUR_ENTITY_ID"
></div>`;

const SQUARESPACE_FULL = `<script src="https://repwell.ai/embed.js" async></script>
<div
  data-repwell-widget="YOUR_WIDGET_ID"
  data-repwell-entity-type="user"
  data-repwell-entity-id="YOUR_ENTITY_ID"
></div>`;

export function SquarespaceGuide() {
  return (
    <IntegrationCard
      id="squarespace"
      icon={<LayoutGrid size={20} className="text-heading" />}
      title="Squarespace"
      description="Embed widgets via Code Injection or per-page Code Blocks."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 1: Code Injection (Site-Wide)
          </h4>
          <StepList>
            <Step number={1} title="Open Code Injection settings">
              <p>
                Go to Settings &rarr; Advanced &rarr; Code Injection.
              </p>
            </Step>
            <Step number={2} title="Add the script to the footer">
              <p>
                Paste the embed.js script in the Footer section. This loads the
                script on every page.
              </p>
              <CodeBlock code={SQUARESPACE_HEADER_SCRIPT} language="html" />
            </Step>
            <Step number={3} title="Add a Code Block on the target page">
              <p>
                Edit the page where you want the widget. Add a Code Block and
                paste the widget container with all three data attributes:
              </p>
              <CodeBlock code={SQUARESPACE_CODE_BLOCK} language="html" />
            </Step>
            <Step number={4} title="Save and preview">
              <p>
                Save the page and view it in a browser (not the Squarespace
                editor) to verify the widget renders.
              </p>
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 2: Code Block (Per-Page)
          </h4>
          <StepList>
            <Step number={1} title="Edit the page in Squarespace">
              <p>Open the page editor and click + to add a new block.</p>
            </Step>
            <Step number={2} title="Insert a Code Block">
              <p>
                Choose Code from the block menu. Paste both the script tag and
                widget container:
              </p>
              <CodeBlock code={SQUARESPACE_FULL} language="html" />
            </Step>
            <Step number={3} title='Enable "Display Source"'>
              <p>
                Toggle off &ldquo;Display Source&rdquo; in the Code Block
                settings so the code executes instead of being shown as text.
              </p>
            </Step>
          </StepList>
        </div>

        <TroubleshootingSection
          items={[
            {
              problem: "Widget does not appear in the Squarespace editor",
              solution:
                "Squarespace's editor does not execute custom scripts. Preview the live page or view the published site.",
            },
            {
              problem: "Code Injection not available",
              solution:
                "Code Injection is available on Squarespace Business and Commerce plans. Upgrade your plan or use the per-page Code Block method.",
            },
            {
              problem: "Squarespace styles override widget appearance",
              solution:
                "RepWell widgets use Shadow DOM for style isolation. If you see styling issues, verify the widget container is not wrapped in a Squarespace element that applies transforms or clipping.",
            },
            {
              problem: "Script loads but widget container is missing",
              solution:
                'Check that the Code Block has "Display Source" toggled off and the div with all three data attributes is present in the rendered HTML.',
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
