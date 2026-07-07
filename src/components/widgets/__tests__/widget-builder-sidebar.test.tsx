// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetBuilderSidebar } from "../widget-builder-sidebar";

vi.mock("../sidebar", () => ({
  GeneralTab: () => <div>General panel</div>,
  ThemeTab: () => <div>Theme panel</div>,
  ContentTab: () => <div>Content panel</div>,
  FiltersTab: () => <div>Filters panel</div>,
  DomainTab: () => <div>Standalone Domains panel</div>,
  AdvancedTab: () => <div>Advanced panel with Allowed Domains</div>,
}));

vi.mock("../version-history/version-list", () => ({
  VersionList: () => <div>History panel</div>,
}));

vi.mock("../embed-code-panel", () => ({
  EmbedCodePanel: () => <div>Embed Code</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Selected value</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-select-options">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("WidgetBuilderSidebar", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("keeps domain restrictions inside Advanced instead of a standalone Domains section", async () => {
    await act(async () => {
      root.render(
        <WidgetBuilderSidebar
          config={{}}
          widgetType="review_carousel"
          entityType="organization"
          entityId={null}
          organizationId="org-123"
          allowedDomains={["app.repwell.com"]}
          templateName="Review Carousel"
          widgetId={null}
          onConfigChange={vi.fn()}
          onDomainsChange={vi.fn()}
          onEntityTypeChange={vi.fn()}
          onEntityIdChange={vi.fn()}
        />,
      );
    });

    const selectOptions = container.querySelector('[data-testid="sidebar-select-options"]');

    expect(selectOptions?.textContent).not.toContain("Domains");
    expect(container.textContent).toContain("Advanced panel with Allowed Domains");
    expect(container.textContent).not.toContain("Standalone Domains panel");
  });

  it("renders the embed code section in the builder sidebar", async () => {
    await act(async () => {
      root.render(
        <WidgetBuilderSidebar
          config={{}}
          widgetType="review_carousel"
          entityType="organization"
          entityId={null}
          organizationId="org-123"
          allowedDomains={["app.repwell.com"]}
          templateName="Review Carousel"
          widgetId="widget-123"
          onConfigChange={vi.fn()}
          onDomainsChange={vi.fn()}
          onEntityTypeChange={vi.fn()}
          onEntityIdChange={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("Embed Code");
  });
});
