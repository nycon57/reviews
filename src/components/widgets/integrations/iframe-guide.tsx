"use client";

import { MonitorSmartphone } from "lucide-react";
import {
  IntegrationCard,
  CodeBlock,
  Step,
  StepList,
  TroubleshootingSection,
} from "./integration-card";

const IFRAME_BASIC = `<iframe
  src="https://app.repwell.com/api/v1/widgets/YOUR_WIDGET_ID/embed"
  width="100%"
  height="600"
  style="border: none; overflow: hidden;"
  title="RepWell Reviews Widget"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;

const IFRAME_RESPONSIVE = `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe
    src="https://app.repwell.com/api/v1/widgets/YOUR_WIDGET_ID/embed"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="RepWell Reviews Widget"
    loading="lazy"
    allow="clipboard-write"
  ></iframe>
</div>`;

const IFRAME_AUTO_RESIZE = `<iframe
  id="repwell-widget"
  src="https://app.repwell.com/api/v1/widgets/YOUR_WIDGET_ID/embed"
  width="100%"
  style="border: none;"
  title="RepWell Reviews Widget"
  loading="lazy"
></iframe>

<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'repwell-resize') {
      var frame = document.getElementById('repwell-widget');
      if (frame) frame.style.height = e.data.height + 'px';
    }
  });
</script>`;

export function IframeGuide() {
  return (
    <IntegrationCard
      id="iframe"
      icon={<MonitorSmartphone size={20} className="text-heading" />}
      title="Iframe Embed"
      description="For platforms that restrict script tags. Works on any site that allows iframes."
    >
      <div className="space-y-6">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            Use the script tag method when possible — it loads faster and
            resizes automatically. Use iframe only on platforms with strict
            Content Security Policies that block third-party scripts.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Basic Iframe Embed
          </h4>
          <StepList>
            <Step number={1} title="Copy the iframe code">
              <p>
                Replace{" "}
                <code className="text-xs bg-muted px-1 rounded">YOUR_WIDGET_ID</code>{" "}
                with your Widget ID.
              </p>
              <CodeBlock code={IFRAME_BASIC} language="html" />
            </Step>
            <Step number={2} title="Paste into your page">
              <p>
                Add the iframe wherever your platform allows HTML: page editors,
                custom code blocks, or template files.
              </p>
            </Step>
            <Step number={3} title="Adjust the height">
              <p>
                Set the <code className="text-xs bg-muted px-1 rounded">height</code> attribute
                based on your widget type. Star rating badges need ~100px;
                full review lists need 400-800px.
              </p>
            </Step>
          </StepList>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Responsive Iframe
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Wrap the iframe in a responsive container for consistent sizing
            across screen widths.
          </p>
          <CodeBlock code={IFRAME_RESPONSIVE} language="html" />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Auto-Resizing Iframe
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            If your platform allows inline scripts, add the resize listener
            so the iframe height adjusts automatically to its content.
          </p>
          <CodeBlock code={IFRAME_AUTO_RESIZE} language="html" />
        </div>

        <TroubleshootingSection
          items={[
            {
              problem: "Iframe shows a blank white page",
              solution:
                "Verify the Widget ID is correct and the widget is published (not draft). Check your browser console for CORS or CSP errors.",
            },
            {
              problem: "Widget is cut off at the bottom",
              solution:
                "Increase the iframe height attribute, or use the auto-resize script to dynamically adjust the height.",
            },
            {
              problem: "Scrollbar appears inside the iframe",
              solution:
                'Add scrolling="no" to the iframe tag and increase the height to fit the content, or use the auto-resize approach.',
            },
            {
              problem: "Platform blocks iframes entirely",
              solution:
                "Some platforms (e.g., certain email builders) strip iframes. Contact RepWell support for alternative embedding options such as static image badges.",
            },
          ]}
        />
      </div>
    </IntegrationCard>
  );
}
