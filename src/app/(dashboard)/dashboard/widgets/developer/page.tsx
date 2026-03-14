import { Code2, Webhook, Paintbrush, Shield } from "lucide-react";

export const metadata = {
  title: "Developer API | RepWell Widgets",
};

export default function DeveloperPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-heading">
          Widget Developer API
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Integrate RepWell widgets with your site using JS hooks, runtime
          configuration, dynamic entity overrides, and custom CSS.
        </p>
      </div>

      {/* Event Hooks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Webhook size={18} className="text-label" />
          <h2 className="text-lg font-semibold text-heading">
            Event Hooks
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Subscribe to widget lifecycle events using{" "}
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
            RepWell.on()
          </code>
          .
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border rounded-md">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Event</th>
                <th className="text-left px-3 py-2 font-medium">Fired when</th>
                <th className="text-left px-3 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-3 py-2 font-mono">ready</td>
                <td className="px-3 py-2">Widget config loaded and rendered</td>
                <td className="px-3 py-2">widgetType, config</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">review-loaded</td>
                <td className="px-3 py-2">Reviews fetched and rendered</td>
                <td className="px-3 py-2">widgetType, config</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">review-clicked</td>
                <td className="px-3 py-2">User clicks a review card</td>
                <td className="px-3 py-2">review_id</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">cta-clicked</td>
                <td className="px-3 py-2">User clicks the CTA button</td>
                <td className="px-3 py-2">widgetId, event</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">error</td>
                <td className="px-3 py-2">Widget fails to load</td>
                <td className="px-3 py-2">error message</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-gray-300 font-mono leading-relaxed">
{`// Subscribe to events
RepWell.on('my-widget-slug', 'ready', (data) => {
  console.log('Widget ready:', data.widgetType);
});

RepWell.on('my-widget-slug', 'review-clicked', (data) => {
  analytics.track('review_click', { widgetId: data.widgetId });
});

// Unsubscribe
const handler = (data) => console.log(data);
RepWell.on('my-widget-slug', 'ready', handler);
RepWell.off('my-widget-slug', 'ready', handler);`}
          </pre>
        </div>
      </section>

      {/* Runtime Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code2 size={18} className="text-label" />
          <h2 className="text-lg font-semibold text-heading">
            Runtime Configuration
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Override safe widget config fields at runtime using{" "}
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
            RepWell.configure()
          </code>
          . The widget re-renders immediately.
        </p>

        <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-gray-300 font-mono leading-relaxed">
{`RepWell.configure('my-widget-slug', {
  theme: {
    colors: { primary: '#1a56db', background: '#f0f4ff' },
  },
  content: {
    showHeader: true,
    ctaText: 'Read More Reviews',
    ctaUrl: 'https://example.com/reviews',
  },
});`}
          </pre>
        </div>

        <p className="text-xs text-muted-foreground">
          Allowed fields: theme.colors.*, content.showHeader, content.showCTA,
          content.ctaText, content.ctaUrl, content.showSource,
          content.showDate, content.showAvatar, content.showBranding.
        </p>

        <div className="pt-2 space-y-3">
          <h3 className="text-sm font-semibold text-heading">
            Dynamic Entity Overrides
          </h3>
          <p className="text-sm text-muted-foreground">
            Keep the base widget ID fixed and optionally pass entity context on
            the host element at runtime. This is useful when one template needs
            to render different profiles on different pages.
          </p>

          <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-gray-300 font-mono leading-relaxed">
{`<script src="https://app.repwell.com/embed.js" async></script>
<div
  data-repwell-widget="team-reviews"
  data-repwell-entity-type="user"
  data-repwell-entity-id="{{ profile.repwellEntityId }}"
></div>`}
            </pre>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported entity types: <code className="px-1 py-0.5 bg-muted rounded text-[11px]">user</code>,{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-[11px]">branch</code>, and{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-[11px]">organization</code>.
            The <code className="px-1 py-0.5 bg-muted rounded text-[11px]">organization</code> override does not accept{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-[11px]">data-repwell-entity-id</code>.
          </p>
        </div>
      </section>

      {/* Custom CSS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Paintbrush size={18} className="text-label" />
          <h2 className="text-lg font-semibold text-heading">
            Custom CSS
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Add custom CSS in Widget Builder &gt; CSS tab. Styles are injected
          inside the Shadow DOM. Available classes: .rw-widget, .rw-header,
          .rw-review, .rw-stars, .rw-cta, .rw-footer.
        </p>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-label" />
          <h2 className="text-lg font-semibold text-heading">
            Security
          </h2>
        </div>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>Custom CSS is sanitized — @import, data: URLs, javascript: URLs, and CSS expressions are stripped.</li>
          <li>CSS is limited to 5,000 characters.</li>
          <li>Runtime overrides restricted to safe visual fields.</li>
          <li>Widget content rendered inside Shadow DOM for style isolation.</li>
          <li>Domain allowlisting restricts which sites can embed the widget.</li>
        </ul>
      </section>
    </div>
  );
}
