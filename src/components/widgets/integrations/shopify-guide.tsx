"use client";

import { ShoppingBag } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const THEME_LIQUID_SCRIPT = `<!-- Add before </body> in theme.liquid -->
<script src="https://app.repwell.com/embed.js" async></script>`;

const SECTION_CODE = `<div data-repwell-widget="YOUR_WIDGET_ID"></div>`;

const SHOPIFY_SECTION_TEMPLATE = `{% comment %}
  RepWell Review Widget Section
{% endcomment %}

<div class="repwell-section" {{ block.shopify_attributes }}>
  <script src="https://app.repwell.com/embed.js" async></script>
  <div data-repwell-widget="{{ section.settings.widget_id }}"></div>
</div>

{% schema %}
{
  "name": "RepWell Reviews",
  "settings": [
    {
      "type": "text",
      "id": "widget_id",
      "label": "Widget ID",
      "info": "Find this in your RepWell dashboard under Widgets → Embed Code."
    }
  ],
  "presets": [
    {
      "name": "RepWell Reviews"
    }
  ]
}
{% endschema %}`;

export function ShopifyGuide() {
  return (
    <IntegrationCard
      id="shopify"
      icon={<ShoppingBag size={20} className="text-repwell-teal-500" />}
      title="Shopify"
      description="Add review widgets to your Shopify store via theme.liquid or custom sections."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 1: Theme Editor (Quick Setup)
          </h4>
          <StepList>
            <Step number={1} title="Open the theme editor">
              <p>
                Go to Online Store &rarr; Themes &rarr; Customize on your
                active theme.
              </p>
            </Step>
            <Step number={2} title="Add a Custom Liquid section">
              <p>
                Click Add section &rarr; Custom Liquid. Paste the embed code:
              </p>
              <CodeBlock
                code={`<script src="https://app.repwell.com/embed.js" async></script>\n<div data-repwell-widget="YOUR_WIDGET_ID"></div>`}
                language="html"
              />
            </Step>
            <Step number={3} title="Position and save">
              <p>
                Drag the section to where you want it on the page, then save.
              </p>
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 2: Theme Code (theme.liquid)
          </h4>
          <StepList>
            <Step number={1} title="Edit your theme code">
              <p>
                Go to Online Store &rarr; Themes &rarr; Actions &rarr; Edit
                code.
              </p>
            </Step>
            <Step number={2} title="Add the script to theme.liquid">
              <p>
                Open <code className="text-xs bg-muted px-1 rounded">theme.liquid</code> and add
                the script tag before the closing{" "}
                <code className="text-xs bg-muted px-1 rounded">&lt;/body&gt;</code> tag:
              </p>
              <CodeBlock code={THEME_LIQUID_SCRIPT} language="html" />
            </Step>
            <Step number={3} title="Place the widget container">
              <p>
                In the template or section file where you want the widget, add:
              </p>
              <CodeBlock code={SECTION_CODE} language="html" />
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Method 3: Custom Section Template
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Create a reusable section with a configurable Widget ID field
            that non-technical users can manage from the theme editor.
          </p>
          <CodeBlock code={SHOPIFY_SECTION_TEMPLATE} language="liquid" />
        </div>

        <TroubleshootingSection
          items={[
            {
              problem: "Widget does not load on product pages",
              solution:
                "Ensure the embed code is placed within the product template or section, not just the homepage template.",
            },
            {
              problem: "Shopify CSP blocks external scripts",
              solution:
                "Shopify storefronts generally allow third-party scripts. If using a headless setup with a custom storefront, add app.repwell.com to your CSP directives.",
            },
            {
              problem: "Widget conflicts with Shopify theme styles",
              solution:
                "RepWell widgets use Shadow DOM and should not conflict. If issues occur, check that no theme JavaScript is removing or modifying the widget container element.",
            },
            {
              problem: "Section template not appearing in theme editor",
              solution:
                'Verify the section file is saved in the sections/ directory with a .liquid extension and includes a valid {% schema %} block with a "presets" array.',
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
