import { ArrowLeft, Code2, Zap, Shield, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer API | Widgets | RepWell",
  description: "JavaScript hooks API documentation for RepWell embeddable widgets.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 text-sm font-mono leading-relaxed overflow-x-auto border border-gray-800">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-repwell-teal-50 flex items-center justify-center">
          <Icon size={16} className="text-repwell-teal-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function WidgetDeveloperPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href="/dashboard/widgets"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} />
          Back to Widgets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Widget Developer API</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use JavaScript hooks to integrate widget events with your application
          and customize behavior at runtime.
        </p>
      </div>

      <div className="space-y-10">
        {/* Event Subscription */}
        <Section icon={Zap} title="Event Hooks">
          <p className="text-sm text-gray-600">
            Subscribe to widget lifecycle events using{" "}
            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
              RepWell.on()
            </code>
            . Callbacks receive an event data object with relevant context.
          </p>

          <CodeBlock>{`// Subscribe to an event
RepWell.on("your-widget-id", "ready", (data) => {
  console.log("Widget ready:", data.widgetType);
});

// Unsubscribe
const handler = (data) => { /* ... */ };
RepWell.on("your-widget-id", "cta-clicked", handler);
RepWell.off("your-widget-id", "cta-clicked", handler);`}</CodeBlock>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Event</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Fired when</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-repwell-teal-500">ready</td>
                  <td className="px-4 py-2 text-gray-600">Widget has finished loading and rendering</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-repwell-teal-500">review-loaded</td>
                  <td className="px-4 py-2 text-gray-600">Reviews have been fetched and displayed</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-repwell-teal-500">review-clicked</td>
                  <td className="px-4 py-2 text-gray-600">User clicks to expand a truncated review</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-repwell-teal-500">cta-clicked</td>
                  <td className="px-4 py-2 text-gray-600">User clicks the call-to-action button</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs text-repwell-teal-500">error</td>
                  <td className="px-4 py-2 text-gray-600">Widget failed to load (network error, domain blocked, etc.)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 mt-4">Callback Data</h3>
          <CodeBlock>{`interface HookEventData {
  widgetId: string;       // The widget slug
  event: string;          // Event name
  widgetType?: string;    // e.g. "lo_review", "company_review"
  config?: object;        // Widget configuration at time of event
  review?: object | null; // Review data (for review-clicked)
  error?: string | null;  // Error message (for error event)
}`}</CodeBlock>
        </Section>

        {/* Runtime Configuration */}
        <Section icon={Code2} title="Runtime Configuration">
          <p className="text-sm text-gray-600">
            Override safe configuration fields at runtime from your host page.
            This is useful for dynamically adjusting theme colors or toggling
            content sections based on user preferences.
          </p>

          <CodeBlock>{`RepWell.configure("your-widget-id", {
  theme: {
    colors: {
      primary: "#1a56db",
      background: "#f9fafb"
    }
  },
  content: {
    showHeader: true,
    showBranding: false,
    ctaText: "Get a Quote",
    ctaUrl: "https://example.com/quote"
  }
});`}</CodeBlock>

          <h3 className="text-sm font-semibold text-gray-800 mt-4">Allowed Override Fields</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Path</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">theme.colors.primary</td>
                  <td className="px-4 py-2 text-gray-600">Hex color string</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">theme.colors.background</td>
                  <td className="px-4 py-2 text-gray-600">Hex color string</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">theme.colors.text</td>
                  <td className="px-4 py-2 text-gray-600">Hex color string</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showHeader</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showCTA</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.ctaText</td>
                  <td className="px-4 py-2 text-gray-600">string</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.ctaUrl</td>
                  <td className="px-4 py-2 text-gray-600">string</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showBranding</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showSource</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showDate</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">content.showAvatar</td>
                  <td className="px-4 py-2 text-gray-600">boolean</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Custom CSS */}
        <Section icon={BookOpen} title="Custom CSS">
          <p className="text-sm text-gray-600">
            Inject custom CSS into the widget via the Widget Builder&apos;s Advanced tab.
            CSS is injected inside the Shadow DOM, so styles are fully scoped and
            cannot leak to or from the host page.
          </p>

          <CodeBlock>{`/* Target widget elements using .rw-* classes */
.rw-widget {
  border-radius: 16px;
  padding: 24px;
}

.rw-review {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.rw-cta {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  border-radius: 999px;
}`}</CodeBlock>

          <h3 className="text-sm font-semibold text-gray-800 mt-4">Common CSS Classes</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Class</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Element</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-widget</td>
                  <td className="px-4 py-2 text-gray-600">Main widget container</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-widget__header</td>
                  <td className="px-4 py-2 text-gray-600">Header section</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-review</td>
                  <td className="px-4 py-2 text-gray-600">Individual review card</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-review__stars</td>
                  <td className="px-4 py-2 text-gray-600">Star rating row</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-review__text</td>
                  <td className="px-4 py-2 text-gray-600">Review text content</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-cta</td>
                  <td className="px-4 py-2 text-gray-600">Call-to-action button</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">.rw-branding</td>
                  <td className="px-4 py-2 text-gray-600">Powered by RepWell footer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Security */}
        <Section icon={Shield} title="Security">
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Custom CSS is sanitized before injection. The following are blocked:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">@import</code>{" "}
                rules (no external stylesheets)
              </li>
              <li>
                <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">data:</code>{" "}
                URLs (prevents data exfiltration)
              </li>
              <li>
                <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">javascript:</code>{" "}
                URLs
              </li>
              <li>CSS expressions and behavior properties</li>
            </ul>
            <p>Maximum CSS length: 5,000 characters.</p>
            <p>
              Runtime configuration overrides via{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">
                RepWell.configure()
              </code>{" "}
              are restricted to safe fields. Security-sensitive fields like{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">widget_id</code>,{" "}
              <code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">organization_id</code>,
              and domain restrictions cannot be overridden.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
