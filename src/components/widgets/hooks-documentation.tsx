"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOOK_EVENTS = [
  {
    name: "ready",
    description: "Fired when the widget has loaded and rendered successfully.",
    payload: "{ widgetId, event, widgetType, config }",
  },
  {
    name: "review-loaded",
    description: "Fired when reviews have been fetched and rendered.",
    payload: "{ widgetId, event, widgetType, config }",
  },
  {
    name: "review-clicked",
    description: "Fired when a user clicks on a review card.",
    payload: "{ widgetId, event, review_id }",
  },
  {
    name: "cta-clicked",
    description: "Fired when a user clicks the CTA button.",
    payload: "{ widgetId, event }",
  },
  {
    name: "error",
    description: "Fired when the widget fails to load.",
    payload: "{ widgetId, event, error }",
  },
] as const;

const EXAMPLE_ON = `// Listen for widget ready event
RepWell.on('my-widget-slug', 'ready', function(data) {
  console.log('Widget loaded:', data.widgetType);
});`;

const EXAMPLE_CONFIGURE = `// Override theme colors at runtime
RepWell.configure('my-widget-slug', {
  theme: {
    colors: {
      primary: '#0066cc',
      background: '#f9fafb'
    }
  },
  content: {
    showHeader: false,
    ctaText: 'Read More Reviews'
  }
});`;

const EXAMPLE_OFF = `// Remove a specific listener
function onReady(data) {
  console.log('Ready!', data);
}

RepWell.on('my-widget-slug', 'ready', onReady);
// Later...
RepWell.off('my-widget-slug', 'ready', onReady);`;

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="text-[11px] font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <pre className="bg-gray-950 text-gray-100 rounded-md px-3 py-2.5 text-xs font-mono overflow-x-auto leading-relaxed">
        {code}
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-7 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white hover:bg-gray-800"
        onClick={handleCopy}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </Button>
    </div>
  );
}

export function HooksDocumentation({ widgetSlug }: { widgetSlug?: string }) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const slug = widgetSlug || "my-widget-slug";

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-label mb-1">
          JavaScript Hooks API
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Register callbacks on the global{" "}
          <code className="bg-muted px-1 rounded text-[11px]">RepWell</code>{" "}
          object to react to widget lifecycle events from your host page.
        </p>
      </div>

      <div className="space-y-3">
        <CodeBlock
          label="Subscribe to events"
          code={EXAMPLE_ON.replace(/my-widget-slug/g, slug)}
        />
        <CodeBlock
          label="Runtime config overrides"
          code={EXAMPLE_CONFIGURE.replace(/my-widget-slug/g, slug)}
        />
        <CodeBlock
          label="Unsubscribe"
          code={EXAMPLE_OFF.replace(/my-widget-slug/g, slug)}
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold text-label mb-2">
          Available Events
        </h4>
        <div className="border rounded-md divide-y">
          {HOOK_EVENTS.map((evt) => (
            <button
              key={evt.name}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
              onClick={() =>
                setExpandedEvent(
                  expandedEvent === evt.name ? null : evt.name,
                )
              }
            >
              <div className="flex items-center gap-2">
                {expandedEvent === evt.name ? (
                  <ChevronDown size={12} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={12} className="text-muted-foreground" />
                )}
                <code className="text-xs font-semibold font-mono">
                  {evt.name}
                </code>
              </div>
              {expandedEvent === evt.name && (
                <div className="mt-1.5 ml-5 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {evt.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Payload:{" "}
                    <code className="bg-muted px-1 rounded">
                      {evt.payload}
                    </code>
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-2 leading-relaxed">
        <strong>Runtime overrides</strong> are limited to safe fields: theme
        colors and content display toggles. Security fields (widget_id,
        organization_id) cannot be overridden.
      </div>
    </div>
  );
}
